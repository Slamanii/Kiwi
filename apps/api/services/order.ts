import { prisma } from '@kiwi/db'
import { NotificationType, OrderStatus, CommunityRole, MessageType, SendMessageInput } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from './notification.js'
import { decrementStock } from './listing.js'

async function assertAdmin(communityId: string, userId: string) {
    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } }
    })
    if (!membership || membership.role !== CommunityRole.ADMIN) throw new Error('Admin access required')
}

const senderSelect = {
    id: true,
    name: true,
    verificationStatus: true,
    profile: { select: { avatarUrl: true } }
} as const

// verificationStatus lives on User, not Profile — merge it into the nested
// profile object so frontend code can read buyer.profile?.verificationStatus.
function mergeVerification<T extends { verificationStatus?: any; profile?: any }>(user: T) {
    const { verificationStatus, profile, ...rest } = user
    return { ...rest, profile: profile ? { ...profile, verificationStatus } : profile }
}

// Buyer's way of flagging interest to the store admin(s) - just a queued Order, no conversation yet.
// The alternative path is a plain DM to an admin, outside this flow entirely.
export async function createOrder(
    buyerId: string,
    communityId: string,
    items: { listingId: string; quantity: number }[],
    description?: string
) {
    if (!items.length) throw new Error('Order must include at least one item')

    const community = await prisma.community.findUnique({ where: { id: communityId }, select: { type: true } })
    if (!community) throw new Error('Community not found')
    if (community.type !== 'MARKETPLACE') throw new Error('This community has no storefront')

    const listings = await prisma.listing.findMany({
        where: { id: { in: items.map(i => i.listingId) }, communityId }
    })
    if (listings.length !== items.length) throw new Error('One or more listings are unavailable')

    for (const item of items) {
        const listing = listings.find(l => l.id === item.listingId)!
        if (listing.status !== 'ACTIVE') throw new Error(`${listing.title} is not available`)
        if (listing.stock < item.quantity) throw new Error(`${listing.title} has insufficient stock`)
    }

    const [order] = await prisma.$transaction([
        prisma.order.create({
            data: {
                buyerId,
                communityId,
                description: description ?? null,
                items: {
                    create: items.map(item => {
                        const listing = listings.find(l => l.id === item.listingId)!
                        return { listingId: item.listingId, quantity: item.quantity, price: listing.price }
                    })
                }
            },
            include: { items: { include: { listing: true } } }
        }),
        prisma.community.update({ where: { id: communityId }, data: { dealsOngoing: { increment: 1 } } })
    ])

    const admins = await prisma.communityMember.findMany({
        where: { communityId, role: CommunityRole.ADMIN },
        select: { userId: true }
    })
    await Promise.all(admins.map(admin => notify({
        userId: admin.userId,
        type: NotificationType.NEW_ORDER,
        body: 'You have a new order waiting in your order panel',
        metadata: { communityId, orderId: order.id }
    })))

    getIO().to(`community:${communityId}`).emit('order:new', order)

    return order
}

// Admin-only list preview of open orders for a store - the "order panel"
export async function getCommunityOrders(communityId: string, adminUserId: string, cursor?: string, limit = 30) {
    await assertAdmin(communityId, adminUserId)

    const orders = await prisma.order.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        // ADMIN_CONTACTED orders always have a conversationId (set atomically inside
        // followUpOnOrder) - once that happens the order lives on in the order-chat list
        // instead, so it drops out of this queue view.
        where: { communityId, status: OrderStatus.PENDING, conversationId: null },
        orderBy: { createdAt: 'asc' },
        include: {
            buyer: { select: senderSelect },
            items: { include: { listing: { select: { id: true, title: true, price: true, images: true } } } }
        }
    })

    const hasMore = orders.length > limit
    if (hasMore) orders.pop()

    return {
        orders: orders.map(order => ({ ...order, buyer: mergeVerification(order.buyer) })),
        nextCursor: hasMore ? orders[orders.length - 1].id : null
    }
}

export async function removeOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new Error('Order not found')
    if (order.buyerId !== userId) throw new Error('Unauthorized')
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ADMIN_CONTACTED) {
        throw new Error('Order can no longer be cancelled')
    }

    await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED } }),
        prisma.community.update({ where: { id: order.communityId }, data: { dealsOngoing: { decrement: 1 } } })
    ])

    getIO().to(`community:${order.communityId}`).emit('order:cancelled', { orderId })
}

// The admin's response to a queued order - lazily finds-or-creates the buyer's persistent store
// conversation and drops the order payload message into it. Every later order from the same buyer
// to the same store reuses that one conversation.
export async function followUpOnOrder(orderId: string, adminUserId: string, content: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { listing: true } }, community: { select: { name: true } } }
    })
    if (!order) throw new Error('Order not found')
    await assertAdmin(order.communityId, adminUserId)

    const message = await prisma.$transaction(async (tx: any) => {
        // Atomic claim (compare-and-swap): the WHERE guard and the write happen as one
        // statement, so Postgres's row lock closes the race where two admins both read
        // claimedByAdminId as null before either commits and both "win" the claim.
        const claim = await tx.order.updateMany({
            where: { id: order.id, OR: [{ claimedByAdminId: null }, { claimedByAdminId: adminUserId }] },
            data: { claimedByAdminId: adminUserId }
        })
        if (claim.count === 0) {
            const current = await tx.order.findUnique({
                where: { id: order.id },
                select: { claimedByAdmin: { select: { name: true } } }
            })
            throw new Error(`${current?.claimedByAdmin?.name ?? 'Another admin'} is already handling this order`)
        }

        const conversation = await tx.storeConversation.upsert({
            where: { buyerId_communityId: { buyerId: order.buyerId, communityId: order.communityId } },
            update: {},
            create: { buyerId: order.buyerId, communityId: order.communityId }
        })

        if (!order.conversationId) {
            await tx.order.update({ where: { id: order.id }, data: { conversationId: conversation.id } })
        }

        const created = await tx.orderMessage.create({
            data: {
                conversationId: conversation.id,
                senderId: adminUserId,
                orderId: order.id,
                type: MessageType.TEXT,
                content,
            },
            include: { sender: { select: senderSelect } }
        })

        await tx.storeConversation.update({
            where: { id: conversation.id },
            data: { lastMessage: content, lastMessageAt: new Date() }
        })

        if (order.status === OrderStatus.PENDING) {
            await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.ADMIN_CONTACTED } })
        }

        return created
    }, { timeout: 15000 })

    const result = { ...message, sender: mergeVerification(message.sender) }

    getIO().to(`order:${result.conversationId}`).emit('message:new', result)

    await notify({
        userId: order.buyerId,
        type: NotificationType.ORDER_MESSAGE,
        title: order.community.name,
        body: content.slice(0, 100),
        metadata: { conversationId: result.conversationId }
    })

    return result
}

// Stock only moves here, once the admin confirms the sale actually happened - not at order
// placement, since a queued order is just an expression of interest, not a guaranteed sale.
export async function completeOrder(orderId: string, adminUserId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order) throw new Error('Order not found')
    await assertAdmin(order.communityId, adminUserId)
    if (order.status === OrderStatus.COMPLETED) throw new Error('Order already completed')
    if (order.status === OrderStatus.CANCELLED) throw new Error('Order was cancelled')

    const updated = await prisma.$transaction(async (tx: any) => {
        for (const item of order.items) {
            await decrementStock(tx, item.listingId, item.quantity)
        }

        await tx.community.update({
            where: { id: order.communityId },
            data: { dealsOngoing: { decrement: 1 }, dealsCompleted: { increment: 1 } }
        })

        return tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.COMPLETED } })
    })

    await notify({
        userId: order.buyerId,
        type: NotificationType.ORDER_COMPLETED,
        body: 'Your order was fulfilled - let others know how it went',
        metadata: { orderId: order.id, conversationId: order.conversationId }
    })

    if (order.conversationId) {
        getIO().to(`order:${order.conversationId}`).emit('order:completed', {
            conversationId: order.conversationId,
            orderId: order.id
        })
    }

    return updated
}

// Convenience wrapper for the admin workflow: resolve the oldest open order containing this
// listing for this store, then complete it.
export async function orderFulfilled(listingId: string, adminUserId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { communityId: true } })
    if (!listing) throw new Error('Listing not found')
    await assertAdmin(listing.communityId, adminUserId)

    const item = await prisma.orderItem.findFirst({
        where: {
            listingId,
            order: { communityId: listing.communityId, status: { in: [OrderStatus.PENDING, OrderStatus.ADMIN_CONTACTED] } }
        },
        orderBy: { order: { createdAt: 'asc' } }
    })
    if (!item) throw new Error('No pending order found for this listing')

    return completeOrder(item.orderId, adminUserId)
}

// Buyer leaves a store review after a completed order - the only path to a review.
export async function reviewOrder(orderId: string, buyerId: string, score: number, comment?: string) {
    if (score < 1 || score > 5) throw new Error('Score must be between 1 and 5')

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new Error('Order not found')
    if (order.buyerId !== buyerId) throw new Error('Unauthorized')
    if (order.status !== OrderStatus.COMPLETED) throw new Error('Order must be completed before it can be reviewed')

    const existing = await prisma.communityReview.findUnique({ where: { orderId } })
    if (existing) throw new Error('You have already reviewed this order')

    const { review } = await prisma.$transaction(async (tx: any) => {
        const created = await tx.communityReview.create({
            data: { reviewerId: buyerId, communityId: order.communityId, orderId, score, comment: comment ?? null }
        })

        const { _avg, _count } = await tx.communityReview.aggregate({
            where: { communityId: order.communityId },
            _avg: { score: true },
            _count: { score: true }
        })

        await tx.community.update({
            where: { id: order.communityId },
            data: { rating: _avg.score ?? score, reviewCount: _count.score }
        })

        return { review: created }
    })

    return review
}

// Buyer's inbox of store conversations - only conversations an admin has already opened
// via followUpOnOrder show up here, since buyers can never create one themselves.
export async function getMyStoreConversations(userId: string) {
    const conversations = await prisma.storeConversation.findMany({
        where: { buyerId: userId },
        orderBy: { lastMessageAt: 'desc' },
        include: { community: { select: { id: true, name: true, avatarUrl: true, type: true } } }
    })

    return Promise.all(conversations.map(async conversation => ({
        ...conversation,
        unreadCount: await prisma.orderMessage.count({
            where: { conversationId: conversation.id, senderId: { not: userId }, read: false }
        })
    })))
}

// Admin-only list of every buyer conversation for a store.
export async function getCommunityStoreConversations(communityId: string, adminUserId: string) {
    await assertAdmin(communityId, adminUserId)

    const conversations = await prisma.storeConversation.findMany({
        where: { communityId },
        orderBy: { lastMessageAt: 'desc' },
        include: { buyer: { select: senderSelect } }
    })

    return conversations.map(c => ({ ...c, buyer: mergeVerification(c.buyer) }))
}

export async function getOrderConversationMessages(conversationId: string, userId: string, cursor?: string, limit = 30) {
    const conversation = await prisma.storeConversation.findUnique({
        where: { id: conversationId },
        include: {
            buyer: { select: senderSelect },
            community: { select: { id: true, name: true, avatarUrl: true, type: true } }
        }
    })
    if (!conversation) throw new Error('Conversation not found')

    const isBuyer = conversation.buyerId === userId
    if (!isBuyer) await assertAdmin(conversation.communityId, userId)

    const messages = await prisma.orderMessage.findMany({
        where: { conversationId, archived: false },
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { createdAt: 'desc' },
        include: {
            sender: { select: senderSelect },
            replyTo: { include: { sender: { select: { id: true, name: true } } } },
            order: {
                include: {
                    buyer: { select: senderSelect },
                    items: { include: { listing: { select: { id: true, title: true, price: true, images: true } } } },
                    review: { select: { id: true } }
                }
            }
        }
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    return {
        conversation: { ...conversation, buyer: mergeVerification(conversation.buyer) },
        messages: messages.map(m => ({
            ...m,
            sender: mergeVerification(m.sender),
            order: m.order ? { ...m.order, buyer: mergeVerification(m.order.buyer) } : m.order,
        })),
        nextCursor: hasMore ? messages[messages.length - 1].id : null
    }
}

export async function markOrderConversationRead(conversationId: string, userId: string) {
    const conversation = await prisma.storeConversation.findUnique({ where: { id: conversationId } })
    if (!conversation) throw new Error('Conversation not found')

    const isBuyer = conversation.buyerId === userId
    if (!isBuyer) await assertAdmin(conversation.communityId, userId)

    await prisma.orderMessage.updateMany({
        where: { conversationId, senderId: { not: userId }, read: false },
        data: { read: true }
    })
}

// Buyer's free-form reply inside an already-open conversation. There is deliberately no
// buyer-facing "start conversation" path - existence of a conversationId (only ever created
// inside followUpOnOrder) is what gates this, mirroring the "admin must DM first" rule.
export async function sendOrderMessage(conversationId: string, senderId: string, data: SendMessageInput) {
    const conversation = await prisma.storeConversation.findUnique({
        where: { id: conversationId },
        include: { community: { select: { name: true } } }
    })
    if (!conversation) throw new Error('Conversation not found')

    const isBuyer = conversation.buyerId === senderId
    if (!isBuyer) await assertAdmin(conversation.communityId, senderId)

    const notifyBody = data.content ?? 'Sent an attachment'

    const message = await prisma.$transaction(async (tx: any) => {
        const created = await tx.orderMessage.create({
            data: {
                conversationId,
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
                sender: { select: senderSelect },
                replyTo: { include: { sender: { select: { id: true, name: true } } } }
            }
        })

        await tx.storeConversation.update({
            where: { id: conversationId },
            data: { lastMessage: notifyBody, lastMessageAt: new Date() }
        })

        return created
    }, { timeout: 15000 })

    const result = { ...message, sender: mergeVerification(message.sender) }

    getIO().to(`order:${conversationId}`).emit('message:new', result)

    if (isBuyer) {
        const admins = await prisma.communityMember.findMany({
            where: { communityId: conversation.communityId, role: CommunityRole.ADMIN },
            select: { userId: true }
        })
        await Promise.all(admins.map(admin => notify({
            userId: admin.userId,
            type: NotificationType.ORDER_MESSAGE,
            title: result.sender.name,
            body: notifyBody.slice(0, 100),
            metadata: { conversationId }
        })))
    } else {
        await notify({
            userId: conversation.buyerId,
            type: NotificationType.ORDER_MESSAGE,
            title: conversation.community.name,
            body: notifyBody.slice(0, 100),
            metadata: { conversationId }
        })
    }

    return result
}

// Buyer's alternative to a review - flags the order as unsatisfactory without leaving a rating.
export async function disputeOrder(orderId: string, buyerId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new Error('Order not found')
    if (order.buyerId !== buyerId) throw new Error('Unauthorized')
    if (order.status !== OrderStatus.COMPLETED) throw new Error('Order must be completed before it can be disputed')

    const updated = await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.DISPUTED } })

    const admins = await prisma.communityMember.findMany({
        where: { communityId: order.communityId, role: CommunityRole.ADMIN },
        select: { userId: true }
    })
    await Promise.all(admins.map(admin => notify({
        userId: admin.userId,
        type: NotificationType.ORDER_MESSAGE,
        body: 'A buyer marked their order as unsatisfactory',
        metadata: { orderId: order.id, communityId: order.communityId }
    })))

    return updated
}
