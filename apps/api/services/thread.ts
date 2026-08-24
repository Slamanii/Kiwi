import { prisma } from '@kiwi/db'
import { getIO } from '../utils/socket.js'
import { ThreadStatus, AgreementStatus, BidStatus, NotificationType, SeekStatus } from '@kiwi/types'
import { notify } from './notification.js'

export async function getThreadsByUser(userId: string) {
    const threads = await prisma.thread.findMany({
        where: {
            OR: [
                { clientId: userId },
                { agentId: userId }
            ]
        },
        orderBy: { updatedAt: 'desc' },
        include: {
            seek: {
                select: {
                    id: true,
                    content: true,
                    type: true,
                    location: true,
                    budget: true,
                }
            },
            client: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true, rating: true } }
                }
            },
            agreement: {
                select: {
                    id: true,
                    status: true,
                    agentFee: true,
                    clientSignedAt: true,
                    agentSignedAt: true,
                    documentUrl: true,
                }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    id: true,
                    content: true,
                    type: true,
                    createdAt: true,
                    senderId: true,
                    read: true,
                }
            }
        }
    })

    return Promise.all(threads.map(async thread => ({
        ...thread,
        unreadCount: await prisma.message.count({
            where: { threadId: thread.id, senderId: { not: userId }, read: false }
        })
    })))
}


export async function getThreadById(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: {
            seek: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } } 
                }
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    profile: {
                        select: {
                            avatarUrl: true,
                            rating: true,
                            completedDeals: true,
                            rate: true,
                            policyNote: true,
                            inspectionFee: true,
                        } 
                    }
                }
            },
            messages: {
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profile: { select: { avatarUrl: true } }
                        }
                    }
                }
            },
            agreement: {
                include: { items: true }
            }
        }
    })

    if (!thread) throw new Error('Thread not found')

    const isParticipant = thread.clientId === userId || thread.agentId === userId
    if (!isParticipant) throw new Error('Unauthorized')

        return thread
} 

export async function deleteThread(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: { agreement: true }
    })

    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId) throw new Error('Only the client can close a thread')
    if (thread.status === ThreadStatus.CLOSED) throw new Error('Thread already closed')
    if (thread.agreement && thread.agreement.status !== AgreementStatus.PENDING) {
        throw new Error('Deal is underway — use endThread to close it with a rating instead')
    }

    await prisma.$transaction(async (tx: any) => {
        const bid = await tx.bid.findFirst({
            where: { seekId: thread.seekId, agentId: thread.agentId }
        })

        if (bid) {
            await tx.bid.update({
                where: { id: bid.id },
                data: { status: BidStatus.REJECTED }
            })
        }

        await tx.profile.update({
            where: { userId: thread.agentId },
            data: { ongoing: { decrement: 1 } }
        })

        await tx.thread.update({
            where: { id: threadId },
            data: { status: ThreadStatus.CLOSED }
        })
    })
}

export async function updateThreadStatus(
    threadId: string,
    userId: string,
    status: ThreadStatus
) {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } })
    if (!thread) throw new Error('Thread not found')

    const isParticipant = thread.clientId === userId || thread.agentId === userId
    if (!isParticipant) throw new Error('Unauthorized')

        return prisma.thread.update({
            where: { id: threadId },
            data: { status }
        })
}

export async function acceptTerms(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        select: { id: true, clientId: true, agentId: true, clientAccepted: true, agentAccepted: true, status: true }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')
    if (thread.status === 'CLOSED') throw new Error('Thread is closed')

    const isClient = thread.clientId === userId
    const updated = await prisma.thread.update({
        where: { id: threadId },
        data: isClient ? { clientAccepted: true } : { agentAccepted: true },
        select: { clientAccepted: true, agentAccepted: true }
    })

    const bothAccepted = updated.clientAccepted && updated.agentAccepted
    const otherUserId = isClient ? thread.agentId : thread.clientId

    getIO().to(`thread:${threadId}`).emit('thread:termsAccepted', {
        threadId,
        userId,
        clientAccepted: updated.clientAccepted,
        agentAccepted: updated.agentAccepted,
        bothAccepted
    })

    if (bothAccepted) {
        await Promise.all([
            notify({ userId: thread.clientId, type: NotificationType.TERMS_ACCEPTED, body: 'Both parties accepted. Chat is now open.', metadata: { threadId } }),
            notify({ userId: thread.agentId, type: NotificationType.TERMS_ACCEPTED, body: 'Both parties accepted. Chat is now open.', metadata: { threadId } })
        ])
    } else {
        await notify({
            userId: otherUserId,
            type: NotificationType.TERMS_PENDING,
            body: 'The other party has accepted the compliance terms. Awaiting your acceptance.',
            metadata: { threadId }
        })
    }
}

export async function endThread(
    threadId: string,
    userId: string,
    reason?: string,
    rating?: { score: number; comment?: string }
) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: {
            seek: { select: { id: true, status: true } },
            agreement: { select: { id: true, status: true } }
        }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')
    if (thread.status === 'CLOSED') throw new Error('Thread already closed')
    if (thread.agreement?.status === AgreementStatus.COMPLETED) {
        throw new Error('This deal already completed successfully — nothing to end')
    }

    const isClient = thread.clientId === userId
    const otherUserId = isClient ? thread.agentId : thread.clientId

    // reaching endThread means the deal never went through completeAgreement's
    // success path, so ending it here always means the deal is unresolved/failed —
    // the client must rate it unless it was already rated (e.g. via a prior dispute)
    let existingReview = null
    if (isClient && thread.agreement) {
        existingReview = await prisma.review.findUnique({ where: { threadId } })
        if (!existingReview && (!rating || rating.score < 1 || rating.score > 5)) {
            throw new Error('A rating (1-5) is required to end a thread with an active deal')
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.thread.update({
            where: { id: threadId },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                endedBy: userId,
                endReason: reason ?? null
            }
        })

        if (thread.agreement) {
            await tx.agreement.update({
                where: { id: thread.agreement.id },
                data: { status: AgreementStatus.DISPUTED }
            })
        }

        if (isClient && thread.agreement && !existingReview && rating) {
            await tx.review.create({
                data: {
                    reviewerId: userId,
                    agentId: thread.agentId,
                    threadId,
                    score: rating.score,
                    comment: rating.comment ?? reason ?? null,
                }
            })

            const { _avg, _count } = await tx.review.aggregate({
                where: { agentId: thread.agentId },
                _avg: { score: true },
                _count: { score: true }
            })

            await tx.profile.update({
                where: { userId: thread.agentId },
                data: { rating: _avg.score ?? 3.5, reviewCount: _count.score }
            })
        }

        // reject the bid, decrement agent ongoing
        await tx.bid.updateMany({
            where: { seekId: thread.seekId, agentId: thread.agentId },
            data: { status: 'REJECTED' }
        })

        await tx.profile.update({
            where: { userId: thread.agentId },
            data: { ongoing: { decrement: 1 } }
        })

        // reopen seek slot if thread was still active
        if (thread.seek && thread.seek.status === 'SELECTING') {
            await tx.seek.update({
                where: { id: thread.seek.id },
                data: { status: 'OPEN' }
            })
        }
    })

    getIO().to(`thread:${threadId}`).emit('thread:ended', {
        threadId,
        endedBy: userId,
        reason: reason ?? null
    })

    getIO().to(`user:${thread.agentId}`).emit('profile:statsUpdated', { userId: thread.agentId })

    if (isClient && thread.agreement && !existingReview && rating) {
        getIO().to(`profile:${thread.agentId}`).emit('profile:ratingUpdated', { userId: thread.agentId })
        await notify({
            userId: thread.agentId,
            type: NotificationType.RATING_RECEIVED,
            body: `You received a ${rating.score}-star rating`,
            metadata: { reviewerId: userId, threadId, score: rating.score }
        })
    }

    await notify({
        userId: otherUserId,
        type: NotificationType.THREAD_ENDED,
        body: 'The other party has ended this thread.',
        metadata: { threadId }
    })
}