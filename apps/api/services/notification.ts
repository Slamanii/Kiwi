import { prisma } from '@kiwi/db'
import { NotificationType } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { sendPushToUser } from '../utils/fcm.js'

interface NotifyInput {
    userId: string
    type: NotificationType
    title?: string
    body: string
    metadata?: Record<string, any>
}

const pushMessages: Record<NotificationType, { title: string }> = {
    [NotificationType.NEW_BID]: { title: 'New bid on your seek' },
    [NotificationType.BID_SELECTED]: { title: 'You were selected' },
    [NotificationType.BID_REJECTED]: { title: 'Bid update' },
    [NotificationType.NEW_MESSAGE]: { title: 'New message' },
    [NotificationType.AGREEMENT_SENT]: { title: 'Agreement ready to review' },
    [NotificationType.AGREEMENT_SIGNED]: { title: 'Agreement signed' },
    [NotificationType.ESCROW_FUNDED]: { title: 'Escrow funded - begin work' },
    [NotificationType.DEAL_COMPLETED]: { title: 'Deal compleyte' },
    [NotificationType.NEW_RESEEK]: { title: 'Your Seek was reshared' },
    [NotificationType.RATING_RECEIVED]: { title: 'Rating just in' },
    [NotificationType.APPLICATION_REJECTED]: { title: 'rejected'},
    [NotificationType.REFERRAL_PAID]: { title: 'Referral payout'},
    [NotificationType.ACCOUNT_BANNED]: { title: 'Ban'},
    [NotificationType.SYSTEM]: { title: 'Kiwi' },
}

export async function notify(input: NotifyInput) {
    const { userId, type, title, body, metadata } = input

    const notification = await prisma.notification.create({
        data: { userId, type, body, metadata }
    })

    getIO().to(`user:${userId}`).emit('notification:new', {
        id: notification.id,
        type,
        title,
        body,
        metadata,
        createdAt: notification.createdAt
    })

    await sendPushToUser(userId, {
        title: pushMessages[type]?.title ?? 'Kiwi',
        body,
        data: {
            type,
            ...(metadata && Object.fromEntries(
                Object.entries(metadata).map(([k, v]) => [k, String(v)])
            ))
        }
    })
    return notification
}


export async function getNotifications(userId: string, cursor?: string, limit = 20) {
    const notifications = await prisma.notification.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: { userId },
        orderBy: { createdAt: 'desc' },
    })

    const hasMore = notifications.length > limit
    if (hasMore) notifications.pop()

    return {
        notifications: notifications.map(n => ({
            ...n,
            title: pushMessages[n.type]?.title ?? 'Kiwi'
        })),
        nextCursor: hasMore ? notifications[notifications.length - 1].id : null
    }
}

export async function markNotificationRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
    })
    if (!notification) throw new Error('Notification not found')
    if (notification.userId !== userId) throw new Error('Unauthorized')

    return prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    })
}