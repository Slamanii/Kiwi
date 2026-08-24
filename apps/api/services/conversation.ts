import { prisma } from '@kiwi/db'
import { ConversationType } from '@kiwi/types'
import { getIO } from '../utils/socket.js'

export async function isBlocked(userIdA: string, userIdB: string) {
    const block = await prisma.blockedUser.findFirst({
        where: {
            OR: [
                { blockerId: userIdA, blockedId: userIdB },
                { blockerId: userIdB, blockedId: userIdA },
            ]
        }
    })
    return !!block
}

export async function blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new Error('Cannot block yourself')

    const target = await prisma.user.findUnique({ where: { id: blockedId } })
    if (!target) throw new Error('User not found')

    return prisma.blockedUser.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        update: {},
        create: { blockerId, blockedId }
    })
}

export async function unblockUser(blockerId: string, blockedId: string) {
    await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } })
}

export async function getBlockedUsers(blockerId: string) {
    return prisma.blockedUser.findMany({
        where: { blockerId },
        include: {
            blocked: {
                select: { id: true, name: true, profile: { select: { avatarUrl: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

async function assertConversationMembership(userId: string, type: ConversationType, conversationId: string) {
    if (type === ConversationType.THREAD) {
        const thread = await prisma.thread.findUnique({ where: { id: conversationId } })
        if (!thread) throw new Error('Thread not found')
        if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')
        return
    }

    if (type === ConversationType.DM) {
        const conversation = await prisma.dMConversation.findUnique({ where: { id: conversationId } })
        if (!conversation) throw new Error('Conversation not found')
        if (conversation.participantA !== userId && conversation.participantB !== userId) throw new Error('Unauthorized')
        return
    }

    if (type === ConversationType.COMMUNITY) {
        const membership = await prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: conversationId, userId } }
        })
        if (!membership) throw new Error('You are not a member of this community')
        return
    }

    const conversation = await prisma.storeConversation.findUnique({ where: { id: conversationId } })
    if (!conversation) throw new Error('Store conversation not found')
    if (conversation.buyerId === userId) return

    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: conversation.communityId, userId } }
    })
    if (!membership || membership.role !== 'ADMIN') throw new Error('Unauthorized')
}

export async function setMuted(userId: string, type: ConversationType, conversationId: string, muted: boolean) {
    await assertConversationMembership(userId, type, conversationId)

    return prisma.conversationPreference.upsert({
        where: { userId_conversationType_conversationId: { userId, conversationType: type, conversationId } },
        update: { muted },
        create: { userId, conversationType: type, conversationId, muted }
    })
}

export async function setPinned(userId: string, type: ConversationType, conversationId: string, pinned: boolean) {
    await assertConversationMembership(userId, type, conversationId)

    return prisma.conversationPreference.upsert({
        where: { userId_conversationType_conversationId: { userId, conversationType: type, conversationId } },
        update: { pinned, pinnedAt: pinned ? new Date() : null },
        create: { userId, conversationType: type, conversationId, pinned, pinnedAt: pinned ? new Date() : null }
    })
}

export async function setArchived(userId: string, type: ConversationType, conversationId: string, archived: boolean) {
    await assertConversationMembership(userId, type, conversationId)

    return prisma.conversationPreference.upsert({
        where: { userId_conversationType_conversationId: { userId, conversationType: type, conversationId } },
        update: { archived },
        create: { userId, conversationType: type, conversationId, archived }
    })
}

export async function getConversationPreferences(userId: string) {
    return prisma.conversationPreference.findMany({ where: { userId } })
}

const senderSelect = {
    id: true,
    name: true,
    profile: { select: { avatarUrl: true } }
} as const

function findMessages(type: ConversationType, conversationId: string, extraWhere: Record<string, any>, cursor?: string, limit = 30) {
    const page = { take: limit + 1, ...(cursor && { skip: 1, cursor: { id: cursor } }), orderBy: { createdAt: 'desc' as const } }

    if (type === ConversationType.THREAD) {
        return prisma.message.findMany({
            where: { threadId: conversationId, ...extraWhere },
            ...page,
            include: { sender: { select: senderSelect } }
        })
    }

    if (type === ConversationType.DM) {
        return prisma.directMessage.findMany({
            where: { conversationId, ...extraWhere },
            ...page,
            include: { sender: { select: senderSelect } }
        })
    }

    if (type === ConversationType.COMMUNITY) {
        return prisma.communityMessage.findMany({
            where: { communityId: conversationId, ...extraWhere },
            ...page,
            include: { sender: { select: senderSelect } }
        })
    }

    return prisma.orderMessage.findMany({
        where: { conversationId, ...extraWhere },
        ...page,
        include: { sender: { select: senderSelect } }
    })
}

export async function getConversationMedia(userId: string, type: ConversationType, conversationId: string, cursor?: string, limit = 30) {
    await assertConversationMembership(userId, type, conversationId)

    const messages = await findMessages(type, conversationId, { mediaUrl: { not: null } }, cursor, limit)

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1].id : null
    }
}

export async function searchConversationMessages(userId: string, type: ConversationType, conversationId: string, query: string, cursor?: string, limit = 30) {
    await assertConversationMembership(userId, type, conversationId)

    const trimmed = query.trim()
    if (!trimmed) return { messages: [], nextCursor: null }

    const messages = await findMessages(type, conversationId, { content: { contains: trimmed, mode: 'insensitive' } }, cursor, limit)

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    return {
        messages,
        nextCursor: hasMore ? messages[messages.length - 1].id : null
    }
}

function messageDelegate(type: ConversationType) {
    if (type === ConversationType.THREAD) return prisma.message
    if (type === ConversationType.DM) return prisma.directMessage
    if (type === ConversationType.COMMUNITY) return prisma.communityMessage
    return prisma.orderMessage
}

function conversationWhere(type: ConversationType, conversationId: string) {
    if (type === ConversationType.THREAD) return { threadId: conversationId }
    if (type === ConversationType.COMMUNITY) return { communityId: conversationId }
    return { conversationId }
}

function roomName(type: ConversationType, conversationId: string) {
    if (type === ConversationType.THREAD) return `thread:${conversationId}`
    if (type === ConversationType.DM) return `dm:${conversationId}`
    if (type === ConversationType.COMMUNITY) return `community:${conversationId}`
    return `order:${conversationId}`
}

async function isConversationModerator(userId: string, type: ConversationType, conversationId: string) {
    if (type === ConversationType.COMMUNITY) {
        const membership = await prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: conversationId, userId } },
            select: { role: true }
        })
        return membership?.role === 'ADMIN'
    }

    if (type === ConversationType.ORDER) {
        const conversation = await prisma.storeConversation.findUnique({
            where: { id: conversationId },
            select: { communityId: true }
        })
        if (!conversation) return false
        const membership = await prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: conversation.communityId, userId } },
            select: { role: true }
        })
        return membership?.role === 'ADMIN'
    }

    return false
}

export async function deleteMessages(userId: string, type: ConversationType, conversationId: string, messageIds: string[]) {
    await assertConversationMembership(userId, type, conversationId)

    const delegate = messageDelegate(type) as any
    const where = conversationWhere(type, conversationId)

    const messages = await delegate.findMany({
        where: { id: { in: messageIds }, ...where },
        select: { id: true, senderId: true }
    })
    if (messages.length === 0) throw new Error('No messages found')

    const isModerator = await isConversationModerator(userId, type, conversationId)
    const unauthorized = messages.some((m: { senderId: string }) => m.senderId !== userId && !isModerator)
    if (unauthorized) throw new Error('Unauthorized')

    const ids = messages.map((m: { id: string }) => m.id)
    await delegate.updateMany({
        where: { id: { in: ids } },
        data: {
            deleted: true,
            deletedAt: new Date(),
            content: null,
            mediaUrl: null,
            mediaSize: null,
            mediaDuration: null,
            fileName: null
        }
    })

    getIO().to(roomName(type, conversationId)).emit('message:deleted', { conversationType: type, conversationId, messageIds: ids })

    return { messageIds: ids }
}

export async function setMessagePinned(userId: string, type: ConversationType, conversationId: string, messageId: string, pinned: boolean) {
    await assertConversationMembership(userId, type, conversationId)

    const delegate = messageDelegate(type) as any
    const where = conversationWhere(type, conversationId)

    const message = await delegate.findFirst({ where: { id: messageId, ...where } })
    if (!message) throw new Error('Message not found')

    const updated = await delegate.update({
        where: { id: messageId },
        data: { pinned, pinnedAt: pinned ? new Date() : null },
        include: { sender: { select: senderSelect } }
    })

    getIO().to(roomName(type, conversationId)).emit(pinned ? 'message:pinned' : 'message:unpinned', { conversationType: type, conversationId, message: updated })

    return updated
}

export async function getPinnedMessage(userId: string, type: ConversationType, conversationId: string) {
    await assertConversationMembership(userId, type, conversationId)

    const delegate = messageDelegate(type) as any
    const where = conversationWhere(type, conversationId)

    return delegate.findFirst({
        where: { ...where, pinned: true },
        orderBy: { pinnedAt: 'desc' },
        include: { sender: { select: senderSelect } }
    })
}

export async function setMessageArchived(userId: string, type: ConversationType, conversationId: string, messageId: string, archived: boolean) {
    await assertConversationMembership(userId, type, conversationId)

    const delegate = messageDelegate(type) as any
    const where = conversationWhere(type, conversationId)

    const message = await delegate.findFirst({ where: { id: messageId, ...where } })
    if (!message) throw new Error('Message not found')

    const updated = await delegate.update({
        where: { id: messageId },
        data: { archived, archivedAt: archived ? new Date() : null },
        include: { sender: { select: senderSelect } }
    })

    getIO().to(roomName(type, conversationId)).emit(archived ? 'message:archived' : 'message:unarchived', { conversationType: type, conversationId, message: updated })

    return updated
}

export async function clearConversationMessages(userId: string, type: ConversationType, conversationId: string) {
    await assertConversationMembership(userId, type, conversationId)

    const delegate = messageDelegate(type) as any
    const where = conversationWhere(type, conversationId)

    await delegate.updateMany({
        where,
        data: {
            deleted: true,
            deletedAt: new Date(),
            content: null,
            mediaUrl: null,
            mediaSize: null,
            mediaDuration: null,
            fileName: null
        }
    })

    if (type === ConversationType.THREAD) {
        await prisma.thread.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
    } else if (type === ConversationType.DM) {
        await prisma.dMConversation.update({ where: { id: conversationId }, data: { lastMessage: null, lastMessageAt: null } })
    } else if (type === ConversationType.COMMUNITY) {
        await prisma.community.update({ where: { id: conversationId }, data: { lastMessage: null } })
    } else {
        await prisma.storeConversation.update({ where: { id: conversationId }, data: { lastMessage: null, lastMessageAt: null } })
    }

    getIO().to(roomName(type, conversationId)).emit('conversation:cleared', { conversationType: type, conversationId })
}
