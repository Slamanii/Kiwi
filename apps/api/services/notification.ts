import { prisma } from '@kiwi/db'
import { NotificationType } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { sendPushToUser } from '../utils/fcm.js'

interface NotifyInput {
    userId: string
    type: NotificationType
    title: string
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