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
    [NotificationType.AGREEMENT_ACCEPTED]: { title: 'Fee accepted' },
    [NotificationType.AGREEMENT_SIGNED]: { title: 'Agreement signed' },
    [NotificationType.ESCROW_FUNDED]: { title: 'Escrow funded - begin work' },
    [NotificationType.DEAL_COMPLETED]: { title: 'Deal complete' },
    [NotificationType.DEAL_DISPUTED]: { title: 'Deal disputed' },
    [NotificationType.NEW_RESEEK]: { title: 'Your Seek was reshared' },
    [NotificationType.RATING_RECEIVED]: { title: 'Rating just in' },
    [NotificationType.APPLICATION_REJECTED]: { title: 'rejected'},
    [NotificationType.APPLICATION_APPROVED]: { title: 'Application approved'},
    [NotificationType.VERIFICATION_APPROVED]: { title: 'Verification approved'},
    [NotificationType.VERIFICATION_REJECTED]: { title: 'Verification rejected'},
    [NotificationType.THREAD_ENDED]: { title: 'Thread ended'},
    [NotificationType.PA_DUE]: { title: 'Assessment due'},
    [NotificationType.THREAD_STALLED]: { title: 'Thread stalled'},
    [NotificationType.COMPLIANCE_REQUIRED]: { title: 'Compliance required'},
    [NotificationType.TERMS_PENDING]: { title: 'Terms Pending'},
    [NotificationType.TERMS_ACCEPTED]: { title: 'Terms Accepted'},
    [NotificationType.REFERRAL_PAID]: { title: 'Referral payout'},
    [NotificationType.NEW_ORDER]: { title: 'New order' },
    [NotificationType.AGREEMENT_ITEM_DUE]: { title: 'Deal checklist update' },
    [NotificationType.ACCOUNT_BANNED]: { title: 'Ban'},
    [NotificationType.COMMUNITY_JOIN_REQUEST]: { title: 'New join request' },
    [NotificationType.COMMUNITY_JOIN_ACCEPTED]: { title: 'Join request accepted' },
    [NotificationType.COMMUNITY_JOIN_DECLINED]: { title: 'Join request declined' },
    [NotificationType.ORDER_MESSAGE]: { title: 'New order message' },
    [NotificationType.ORDER_COMPLETED]: { title: 'Order fulfilled - leave a review' },
    [NotificationType.SYSTEM]: { title: 'Kasa' },
}

// Where tapping a notification (in-app or device push) should land.
function resolveNotificationUrl(
    type: NotificationType,
    recipientId: string,
    metadata?: Record<string, any>
): string {
    switch (type) {
        case NotificationType.NEW_BID:
        case NotificationType.BID_SELECTED:
        case NotificationType.BID_REJECTED:
        case NotificationType.NEW_RESEEK:
            return metadata?.seekId ? `/seek/${metadata.seekId}` : '/profile/notifications'

        case NotificationType.NEW_MESSAGE:
        case NotificationType.AGREEMENT_SENT:
        case NotificationType.AGREEMENT_ACCEPTED:
        case NotificationType.AGREEMENT_SIGNED:
        case NotificationType.AGREEMENT_ITEM_DUE:
        case NotificationType.ESCROW_FUNDED:
        case NotificationType.DEAL_COMPLETED:
        case NotificationType.DEAL_DISPUTED:
        case NotificationType.THREAD_STALLED:
        case NotificationType.THREAD_ENDED:
        case NotificationType.PA_DUE:
        case NotificationType.TERMS_PENDING:
        case NotificationType.TERMS_ACCEPTED:
        case NotificationType.COMPLIANCE_REQUIRED:
            return metadata?.threadId ? `/chat/thread/${metadata.threadId}` : '/chat'

        case NotificationType.RATING_RECEIVED:
            return `/profile/${recipientId}/reviews`

        case NotificationType.APPLICATION_APPROVED:
        case NotificationType.APPLICATION_REJECTED:
            return '/profile/agent-application'

        case NotificationType.VERIFICATION_APPROVED:
        case NotificationType.VERIFICATION_REJECTED:
            return '/profile/verify'

        case NotificationType.REFERRAL_PAID:
            return '/profile/referral'

        case NotificationType.NEW_ORDER:
            return metadata?.communityId ? `/communities/${metadata.communityId}/orders` : '/profile/notifications'

        case NotificationType.ORDER_MESSAGE:
            return metadata?.conversationId ? `/orders/${metadata.conversationId}` : '/profile/notifications'

        case NotificationType.ORDER_COMPLETED:
            return metadata?.orderId ? `/orders/${metadata.orderId}/review` : '/profile/notifications'

        case NotificationType.COMMUNITY_JOIN_REQUEST:
            return metadata?.communityId ? `/communities/${metadata.communityId}/requests` : '/profile/notifications'

        case NotificationType.COMMUNITY_JOIN_ACCEPTED:
        case NotificationType.COMMUNITY_JOIN_DECLINED:
            return metadata?.communityId ? `/communities/${metadata.communityId}` : '/profile/notifications'

        case NotificationType.ACCOUNT_BANNED:
        case NotificationType.SYSTEM:
        default:
            return '/profile/notifications'
    }
}

export async function notify(input: NotifyInput) {
    const { userId, type, title, body, metadata } = input
    const url = resolveNotificationUrl(type, userId, metadata)
    const fullMetadata = { ...metadata, url }

    const notification = await prisma.notification.create({
        data: { userId, type, body, metadata: fullMetadata }
    })

    getIO().to(`user:${userId}`).emit('notification:new', {
        id: notification.id,
        type,
        title,
        body,
        metadata: fullMetadata,
        createdAt: notification.createdAt
    })

    await sendPushToUser(userId, {
        title: pushMessages[type]?.title ?? 'Kasa',
        body,
        data: {
            type,
            url,
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
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
    })

    const hasMore = notifications.length > limit
    if (hasMore) notifications.pop()

    return {
        notifications: notifications.map(n => ({
            ...n,
            title: pushMessages[n.type]?.title ?? 'Kasa'
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

    const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    })

    getIO().to(`user:${userId}`).emit('notification:read', { id: notificationId })

    return updated
}