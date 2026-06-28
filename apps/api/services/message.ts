import { prisma } from '@kiwi/db'
import { MessageType, NotificationType, SendMessageInput, CreateCommunityInput, CommunityRole, CommunityMessagingMode } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from './notification.js'

export async function sendMessage(
    threadId: string,
    senderId: string,
    data: SendMessageInput
) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        select: {
            id: true,
            clientId: true,
            agentId: true,
            status: true,
        }
    })

    if (!thread) throw new Error('thread not found')
    if (thread.status === 'CLOSED' || thread.status === 'ARCHIVED') {
        throw new Error('Thread is no longer active')
    }

    const isParticipant = thread.clientId === senderId || thread.agentId === senderId
        if (!isParticipant) throw new Error('unauthorized')

            const message = await prisma.message.create({ 
                data: {
                    threadId,
                    senderId,
                    type: data.type ?? MessageType.TEXT,
                    content: data.content ?? null,
                    mediaUrl: data.mediaUrl ?? null,
                    mediaSize: data.mediaSize ?? null,
                    mediaDuration: data.mediaDuration ?? null,
                    fileName: data.fileName ?? null,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profile: { select: { avatarUrl: true } }
                        }
                    }
                }
        })

        await prisma.thread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() }
        })
        getIO().to(`thread:${threadId}`).emit(`message:new`, message)

        const receiverId = senderId === thread.clientId ? thread.agentId : thread.clientId
        await notify({
            userId: receiverId,
            type: NotificationType.NEW_MESSAGE,
            title: 'New Message',
            body: data.content ?? 'Sent an attachment',
            metadata: { threadId }
        })

        return message
}

export async function sendDM(
  senderId: string,
  receiverId: string,
  data: SendMessageInput
) {
  if (senderId === receiverId) throw new Error('Cannot message yourself')

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
  if (!receiver) throw new Error('User not found')

  // create conversation if first message between these two users
  const conversation = await prisma.dMConversation.upsert({
    where: {
      participantA_participantB: {
        participantA: senderId < receiverId ? senderId : receiverId,
        participantB: senderId < receiverId ? receiverId : senderId,
      }
    },
    update: {
      lastMessage: data.content ?? 'Sent an attachment',
      lastMessageAt: new Date(),
    },
    create: {
      participantA: senderId < receiverId ? senderId : receiverId,
      participantB: senderId < receiverId ? receiverId : senderId,
      lastMessage: data.content ?? 'Sent an attachment',
      lastMessageAt: new Date(),
    }
  })

  const message = await prisma.directMessage.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId,
      type: data.type ?? MessageType.TEXT,
      content: data.content ?? null,
      mediaUrl: data.mediaUrl ?? null,
      mediaSize: data.mediaSize ?? null,
      mediaDuration: data.mediaDuration ?? null,
      fileName: data.fileName ?? null,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profile: { select: { avatarUrl: true } }
        }
      }
    }
  })

  // emit to DM conversation room
  getIO().to(`dm:${conversation.id}`).emit('message:new', message)

  // notify receiver
  await notify({
    userId: receiverId,
    type: NotificationType.NEW_MESSAGE,
    title: 'New message',
    body: data.content ?? 'Sent an attachment',
    metadata: { conversationId: conversation.id }
  })

  return message
}


export async function markMessagesRead(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } })
    if (!thread) throw new Error('Thread not found')

        const isParticipant = thread.clientId === userId || thread.agentId === userId
        if (!isParticipant) throw new Error('Unauthorized')

            await prisma.message.updateMany({
                where: {
                    threadId,
                    senderId: { not: userId },
                },
                data: { }
            })

            const senderId = userId === thread.clientId ? thread.agentId : thread.clientId
            getIO().to(`user:${senderId}`).emit('messages:read', { threadId })
}

export async function getUnreadCount(userId: string) {
    const threads = await prisma.thread.findMany({
        where: {
            OR: [{ clientId: userId }, { agentId: userId }]
        },
        select: { id: true, clientId: true, agentId: true }
    })

    const counts = await Promise.all(
        threads.map(async (thread) => {
            const count = await prisma.message.count({
                where: {
                    threadId: thread.id,
                    senderId: { not: userId },
                }
            })
            return { threadId: thread.id, count }
        })
    )

    const total = counts.reduce((sum, t) => sum + t.count, 0)
    return { total, threads: counts.filter(t => t.count > 0)}
}


export async function sendCommunityMessage(
    communityId: string,
    senderId: string,
    data: SendMessageInput
) {
    const [membership, community] = await Promise.all([
        prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId: senderId } },
            select: { role: true, canPost: true }
        }),
        prisma.community.findUnique({
            where: { id: communityId },
            select: { messagingMode: true }
        })
    ])

    if (!membership) throw new Error('You are not a member of this community')
    if (!community) throw new Error('Community not found')

    const canSend =
        membership.role === CommunityRole.ADMIN ||
        community.messagingMode === CommunityMessagingMode.ALL_MEMBERS ||
        (community.messagingMode === CommunityMessagingMode.SELECTED_MEMBERS && membership.canPost)

    if (!canSend) throw new Error('Only admins can send messages in this community')

    const message = await prisma.$transaction(async (tx: any) => {
        const created = await tx.communityMessage.create({
            data: {
                communityId,
                senderId,
                type: data.type ?? MessageType.TEXT,
                content: data.content ?? null,
                mediaUrl: data.mediaUrl ?? null,
                mediaSize: data.mediaSize ?? null,
                mediaDuration: data.mediaDuration ?? null,
                fileName: data.fileName ?? null,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profile: { select: { avatarUrl: true } }
                    }
                }
            }
        })

        await tx.community.update({
            where: { id: communityId },
            data: {
                lastMessage: data.content ?? 'Sent an attachment',
                lastMessageAt: new Date(),
            }
        })

        return created
    })

    getIO().to(`community:${communityId}`).emit('message:new', message)

    return message
}

export async function createCommunity(
    creatorId: string,
    data: CreateCommunityInput
) {
    const community = await prisma.$transaction(async (tx: any) => {
        const created = await tx.community.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                avatarUrl: data.avatarUrl ?? null,
                creatorId,
                isPrivate: data.isPrivate ?? false,
                memberCount: 1,
                lastMessageAt: new Date(),
            }
        })
        await tx.communityMember.create({
            data: {
                communityId: created.id,
                userId: creatorId,
                role: CommunityRole.ADMIN
            }
        })

        return created

    })

    getIO().to(`user:${creatorId}`).emit('community:created', community)

    return community
}

// toggle messaging mode
export async function updateCommunityMessagingMode(
  communityId: string,
  adminId: string,
  mode: CommunityMessagingMode
) {
  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: adminId } }
  })
  if (!membership || membership.role !== CommunityRole.ADMIN) {
    throw new Error('Unauthorized')
  }

  return prisma.community.update({
    where: { id: communityId },
    data: { messagingMode: mode }
  })
}

// toggle canPost for a specific member
export async function toggleMemberPostPermission(
  communityId: string,
  adminId: string,
  memberId: string
) {
  const admin = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: adminId } }
  })
  if (!admin || admin.role !== CommunityRole.ADMIN) {
    throw new Error('Unauthorized')
  }

  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: memberId } }
  })
  if (!member) throw new Error('Member not found')

  return prisma.communityMember.update({
    where: { communityId_userId: { communityId, userId: memberId } },
    data: { canPost: !member.canPost }
  })
}