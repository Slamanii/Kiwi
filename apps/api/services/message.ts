import { prisma } from '@kiwi/db'
import { MessageType, NotificationType, SendMessageInput, CommunityRole, CommunityMessagingMode } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from './notification.js'
import { isBlocked } from './conversation.js'

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
            clientAccepted: true, 
            agentAccepted: true,
            status: true,
        }
    })

    if (!thread) throw new Error('thread not found')
    if (thread.clientId !== senderId && thread.agentId !== senderId) throw new Error('Unauthorized')
    if (thread.status === 'CLOSED' || thread.status === 'ARCHIVED') {
        throw new Error('Thread is no longer active')
    }
    if (!thread.clientAccepted || !thread.agentAccepted) {
        throw new Error('Both parties must accept compliance terms before messaging')
    }

    const isParticipant = thread.clientId === senderId || thread.agentId === senderId
        if (!isParticipant) throw new Error('unauthorized')

            const otherPartyId = senderId === thread.clientId ? thread.agentId : thread.clientId
            if (await isBlocked(senderId, otherPartyId)) throw new Error('Unable to send message')

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
                    replyToId: data.replyToId ?? null,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profile: { select: { avatarUrl: true } }
                        }
                    },
                    replyTo: { include: { sender: { select: { id: true, name: true } } } }
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

  if (await isBlocked(senderId, receiverId)) throw new Error('Unable to send message')

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
      replyToId: data.replyToId ?? null,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profile: { select: { avatarUrl: true } }
        }
      },
      replyTo: { include: { sender: { select: { id: true, name: true } } } }
    }
  })

  // emit to DM conversation room
  getIO().to(`dm:${conversation.id}`).emit('message:new', message)

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
                data: { read: true }
            })

            const senderId = userId === thread.clientId ? thread.agentId : thread.clientId
            getIO().to(`user:${senderId}`).emit('messages:read', { threadId })
}

export async function getThreadMessages(threadId: string, userId: string, cursor?: string, limit = 30) {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } })
    if (!thread) throw new Error('Thread not found')

    const isParticipant = thread.clientId === userId || thread.agentId === userId
    if (!isParticipant) throw new Error('Unauthorized')

    const messages = await prisma.message.findMany({
        where: { threadId, archived: false },
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { createdAt: 'desc' },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            },
            replyTo: { include: { sender: { select: { id: true, name: true } } } }
        }
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1].id : null
    }
}

export async function getDMMessages(userId: string, otherUserId: string, cursor?: string, limit = 30) {
    const conversation = await prisma.dMConversation.findUnique({
        where: {
            participantA_participantB: {
                participantA: userId < otherUserId ? userId : otherUserId,
                participantB: userId < otherUserId ? otherUserId : userId,
            }
        }
    })

    if (!conversation) {
        return { conversationId: null, messages: [], nextCursor: null }
    }

    const messages = await prisma.directMessage.findMany({
        where: { conversationId: conversation.id, archived: false },
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { createdAt: 'desc' },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            },
            replyTo: { include: { sender: { select: { id: true, name: true } } } }
        }
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    return {
        conversationId: conversation.id,
        messages,
        nextCursor: hasMore ? messages[messages.length - 1].id : null
    }
}

export async function getDMConversations(userId: string) {
    const conversations = await prisma.dMConversation.findMany({
        where: { OR: [{ participantA: userId }, { participantB: userId }] },
        orderBy: { lastMessageAt: 'desc' },
    })

    return Promise.all(conversations.map(async (conversation) => {
        const otherUserId = conversation.participantA === userId
            ? conversation.participantB
            : conversation.participantA

        const [otherUser, unreadCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: otherUserId },
                select: { id: true, name: true, profile: { select: { avatarUrl: true } } }
            }),
            prisma.directMessage.count({
                where: { conversationId: conversation.id, receiverId: userId, read: false }
            })
        ])

        return {
            id: conversation.id,
            otherUser,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCount,
        }
    }))
}

export async function markDMRead(conversationId: string, userId: string) {
    const conversation = await prisma.dMConversation.findUnique({ where: { id: conversationId } })
    if (!conversation) throw new Error('Conversation not found')

    const isParticipant = conversation.participantA === userId || conversation.participantB === userId
    if (!isParticipant) throw new Error('Unauthorized')

    await prisma.directMessage.updateMany({
        where: { conversationId, receiverId: userId, read: false },
        data: { read: true }
    })

    const otherUserId = conversation.participantA === userId ? conversation.participantB : conversation.participantA
    getIO().to(`user:${otherUserId}`).emit('messages:read', { conversationId })
}

export async function getCommunityMessages(communityId: string, userId: string, cursor?: string, limit = 30) {
    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } }
    })
    if (!membership) throw new Error('You are not a member of this community')

    const messages = await prisma.communityMessage.findMany({
        where: { communityId, archived: false },
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { createdAt: 'desc' },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            },
            listing: { select: { id: true, title: true, description: true, price: true, currency: true, images: true } },
            poll: { include: { options: { orderBy: { order: 'asc' } } } },
            replyTo: { include: { sender: { select: { id: true, name: true } } } }
        }
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1].id : null
    }
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
                replyToId: data.replyToId ?? null,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profile: { select: { avatarUrl: true } }
                    }
                },
                replyTo: { include: { sender: { select: { id: true, name: true } } } }
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