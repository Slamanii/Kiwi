import { prisma } from '@kiwi/db'
import { AgreementStatus, AgreementStage, AgreementItemKind, AgreementSentiment, ThreadStatus, SeekStatus, BidStatus, NotificationType } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from './notification.js'
import { AGREEMENT_TEMPLATE } from '../constants/agreementTemplate.js'

const CHECKPOINT_DELAY_MS = 2 * 24 * 60 * 60 * 1000

export async function proposeAgreementFee(threadId: string, userId: string, agentFee: number) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: { agreement: true }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')
    if (!thread.agreement) throw new Error('No agreement found for this thread')
    if (thread.agreement.status !== AgreementStatus.PENDING) throw new Error('Fee negotiation has already closed')
    if (thread.agreement.proposedBy === userId) throw new Error('Waiting on the other party to respond')

    const updated = await prisma.agreement.update({
        where: { id: thread.agreement.id },
        data: { agentFee, proposedBy: userId }
    })

    const otherUserId = userId === thread.clientId ? thread.agentId : thread.clientId
    await notify({
        userId: otherUserId,
        type: NotificationType.AGREEMENT_SENT,
        body: `A new fee of ₦${agentFee.toLocaleString()} has been proposed for this deal.`,
        metadata: { agreementId: updated.id, threadId }
    })

    return updated
}

export async function acceptAgreementFee(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: { agreement: true }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')
    if (!thread.agreement) throw new Error('No agreement found for this thread')
    if (thread.agreement.status !== AgreementStatus.PENDING) throw new Error('Fee negotiation has already closed')
    if (thread.agreement.proposedBy === userId) throw new Error('You cannot accept your own proposal')

    const now = new Date()
    const checkpointUnlocksAt = new Date(now.getTime() + CHECKPOINT_DELAY_MS)
    const firstCheckpoint = AGREEMENT_TEMPLATE.find(i => i.kind === AgreementItemKind.CHECKPOINT)

    const agreement = await prisma.agreement.update({
        where: { id: thread.agreement.id },
        data: {
            status: AgreementStatus.IN_PROGRESS,
            items: {
                create: AGREEMENT_TEMPLATE.map(item => ({
                    requirement: item.requirement,
                    stage: item.stage,
                    kind: item.kind,
                    order: item.order,
                    unlocksAt: item.stage === AgreementStage.BEFORE
                        ? now
                        : (firstCheckpoint && item.order === firstCheckpoint.order ? checkpointUnlocksAt : null)
                }))
            }
        },
        include: { items: true }
    })

    await Promise.all([
        notify({
            userId: thread.clientId,
            type: NotificationType.AGREEMENT_ACCEPTED,
            body: 'The fee has been accepted — your deal checklist is ready.',
            metadata: { agreementId: agreement.id, threadId }
        }),
        notify({
            userId: thread.agentId,
            type: NotificationType.AGREEMENT_ACCEPTED,
            body: 'The fee has been accepted — the deal is now in progress.',
            metadata: { agreementId: agreement.id, threadId }
        }),
    ])

    return agreement
}

export async function endNegotiation(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: { agreement: true }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')
    if (thread.status === ThreadStatus.CLOSED) throw new Error('Thread already closed')
    if (!thread.agreement || thread.agreement.status !== AgreementStatus.PENDING) {
        throw new Error('Negotiation has already closed — use endThread to close the deal instead')
    }

    const otherUserId = userId === thread.clientId ? thread.agentId : thread.clientId
    const agreementId = thread.agreement.id

    await prisma.$transaction(async (tx: any) => {
        await tx.agreement.delete({ where: { id: agreementId } })

        await tx.bid.updateMany({
            where: { seekId: thread.seekId, agentId: thread.agentId },
            data: { status: BidStatus.REJECTED }
        })

        await tx.profile.update({
            where: { userId: thread.agentId },
            data: { ongoing: { decrement: 1 } }
        })

        await tx.thread.update({
            where: { id: threadId },
            data: { status: ThreadStatus.CLOSED, closedAt: new Date(), endedBy: userId }
        })
    })

    getIO().to(`thread:${threadId}`).emit('thread:ended', { threadId, endedBy: userId, reason: 'Fee negotiation ended' })
    getIO().to(`user:${thread.agentId}`).emit('profile:statsUpdated', { userId: thread.agentId })

    await notify({
        userId: otherUserId,
        type: NotificationType.THREAD_ENDED,
        body: 'The other party ended the fee negotiation.',
        metadata: { threadId }
    })
}


export async function answerAgreementItem(
    itemId: string,
    userId: string,
    sentiment: AgreementSentiment,
    answer?: string
) {
    const item = await prisma.agreementItem.findUnique({
        where: { id: itemId },
        include: {
            agreement: {
                include: { thread: true }
            }
        }
    })
    if (!item) throw new Error('Item not found')

    const { thread } = item.agreement
    if (thread.clientId !== userId) throw new Error('Only the client can answer agreement items')
    if (item.completed) throw new Error('Item already answered')
    if (!item.unlocksAt || item.unlocksAt > new Date()) throw new Error('Not yet available')

    if (item.kind === AgreementItemKind.CHECKPOINT) {
        if (sentiment === AgreementSentiment.BAD) {
            return prisma.agreementItem.update({
                where: { id: itemId },
                data: {
                    sentiment,
                    answer,
                    answeredAt: new Date(),
                    answeredBy: userId,
                    unlocksAt: new Date(Date.now() + CHECKPOINT_DELAY_MS),
                    notifiedAt: null,
                }
            })
        }

        const updated = await prisma.agreementItem.update({
            where: { id: itemId },
            data: {
                sentiment,
                answer,
                answeredAt: new Date(),
                answeredBy: userId,
                completed: true,
                completedAt: new Date(),
            }
        })

        const following = await prisma.agreementItem.findMany({
            where: { agreementId: item.agreementId, order: { gt: item.order } },
            orderBy: { order: 'asc' }
        })

        const toUnlock: string[] = []
        for (const next of following) {
            if (next.kind === AgreementItemKind.CHECKPOINT) break
            toUnlock.push(next.id)
        }

        if (toUnlock.length > 0) {
            await prisma.agreementItem.updateMany({
                where: { id: { in: toUnlock } },
                data: { unlocksAt: new Date() }
            })
        }

        await notify({
            userId: thread.clientId,
            type: NotificationType.AGREEMENT_ITEM_DUE,
            body: 'New agreement questions are ready to answer.',
            metadata: { agreementId: item.agreementId, threadId: thread.id }
        })

        return updated
    }

    return prisma.agreementItem.update({
        where: { id: itemId },
        data: {
            sentiment,
            answer,
            completed: true,
            completedAt: new Date(),
            answeredBy: userId,
        }
    })
}

export async function signAgreement(agreementId: string, userId: string) {
    const agreement = await prisma.agreement.findUnique({
        where: { id: agreementId },
        include: {
            thread: true,
            items: true,
        }
    })
    if (!agreement) throw new Error('Agreement not found')

    const { thread } = agreement
    const isClient = thread.clientId === userId
    const isAgent = thread.agentId === userId
    if (!isClient && !isAgent) throw new Error('Unauthorized')

    if (agreement.status !== AgreementStatus.IN_PROGRESS) throw new Error('Agreement is not ready to sign')
    if (agreement.items.some(item => !item.completed)) throw new Error('The checklist is not yet complete')

    if (isClient && agreement.clientSignedAt) throw new Error('Already signed')
    if (isAgent && agreement.agentSignedAt) throw new Error('Already signed')

        const updateData: any = isClient
            ? { clientSignedAt: new Date(), clientSignature: userId }
            : { agentSignedAt: new Date(), agentSignature: userId }

        const updated = await prisma.agreement.update({
            where: { id: agreementId },
            data: updateData,
            include: { thread: true }
        })

        if (updated.clientSignedAt && updated.agentSignedAt) {
            await prisma.agreement.update({
                where: { id: agreementId },
                data: { status: AgreementStatus.SIGNED }
            })
            //TODO: generate pdf here

            await Promise.all([
                notify({
                    userId: thread.clientId,
                    type: NotificationType.AGREEMENT_SIGNED,
                    body: 'Both parties have signed off — this deal has reached fulfillment.',
                    metadata: { agreementId, threadId: thread.id }
                }),
                notify({
                    userId: thread.agentId,
                    type: NotificationType.AGREEMENT_SIGNED,
                    body: 'Both parties have signed off — this deal has reached fulfillment.',
                    metadata: { agreementId, threadId: thread.id }
                }),
            ])
        }
        return updated
}


export async function disputeAgreement(agreementId: string, userId: string, reason?: string) {
    const agreement = await prisma.agreement.findUnique({
        where: { id: agreementId },
        include: { thread: true }
    })
    if (!agreement) throw new Error('Agreement not found')

    const { thread } = agreement
    const isClient = thread.clientId === userId
    const isAgent = thread.agentId === userId
    if (!isClient && !isAgent) throw new Error('Unauthorized')

    if (agreement.status !== AgreementStatus.SIGNED && agreement.status !== AgreementStatus.IN_PROGRESS) {
        throw new Error('Only a signed or in-progress agreement can be disputed')
    }

    const updated = await prisma.agreement.update({
        where: { id: agreementId },
        data: {
            status: AgreementStatus.DISPUTED,
            disputeReason: reason ?? null,
            disputedBy: userId,
        }
    })

    getIO().to(`thread:${thread.id}`).emit('thread:disputed', {
        threadId: thread.id,
        agreementId,
        disputedBy: userId,
        reason: reason ?? null,
    })

    const otherUserId = isClient ? thread.agentId : thread.clientId
    await notify({
        userId: otherUserId,
        type: NotificationType.DEAL_DISPUTED,
        body: 'The other party has disputed this deal.',
        metadata: { agreementId, threadId: thread.id }
    })

    return updated
}

export async function getAgreementByThread(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } })
    if (!thread) throw new Error('Thread not found')

        const isParticipant = thread.clientId === userId || thread.agentId === userId
        if (!isParticipant) throw new Error('Unauthorized')

            return prisma.agreement.findUnique({
                where: { threadId },
                include: {
                    items: {
                        orderBy: [{ stage: 'asc' }, { order: 'asc' }]
                    }
                }
            })
}

export async function completeAgreement(
    agreementId: string,
    clientId: string,
    rating: { score: number; comment?: string }
) {
    if (rating.score < 1 || rating.score > 5) throw new Error('Score must be between 1 and 5')

    const agreement = await prisma.agreement.findUnique({
        where: { id: agreementId },
        include: {
            thread: true,
            items: true,
        }
    })

    if (!agreement) throw new Error('Agreement not found')
    if (agreement.thread.clientId !== clientId) {
        throw new Error('Unauthorized')
    }
    if (agreement.status !== AgreementStatus.SIGNED) {
        throw new Error('Agreement must be signed by both parties before it can be completed')
    }

    const incomplete = agreement.items.filter((item) => !item.completed)

    if (incomplete.length > 0) {
        throw new Error(`${incomplete.length} requirements still incomplete`)
    }

    const { rating: agentRating, reviewCount } = await prisma.$transaction(async (tx: any) => {
        await tx.agreement.update({
            where: { id: agreementId },
            data: { status: AgreementStatus.COMPLETED }
        })

    await tx.profile.update({
        where: { userId: agreement.thread.agentId },
        data: {
            completedDeals: { increment: 1 },
            ongoing: { decrement: 1 }
         }
    })
    await tx.thread.update({
        where: { id: agreement.threadId },
        data: { status: ThreadStatus.CLOSED }
    })

    await tx.seek.update({
        where: { id: agreement.thread.seekId },
        data: { status: SeekStatus.DEPRECATED }
    })

    await tx.review.create({
        data: {
            reviewerId: clientId,
            agentId: agreement.thread.agentId,
            threadId: agreement.threadId,
            score: rating.score,
            comment: rating.comment ?? null,
        }
    })

    const { _avg, _count } = await tx.review.aggregate({
        where: { agentId: agreement.thread.agentId },
        _avg: { score: true },
        _count: { score: true }
    })

    await tx.profile.update({
        where: { userId: agreement.thread.agentId },
        data: {
            rating: _avg.score ?? 3.5,
            reviewCount: _count.score
        }
    })

    return { rating: _avg.score ?? 3.5, reviewCount: _count.score }
  })

  const clientProfile = await prisma.profile.findUnique({
        where: { userId: agreement.thread.clientId }
    })
    getIO().to(`profile:${agreement.thread.clientId}`).emit('profile:statsUpdated', {
        userId: agreement.thread.clientId,
        requests: clientProfile?.requests,
        ongoing: clientProfile?.ongoing,
        completedDeals: clientProfile?.completedDeals,
    })

    getIO().to(`profile:${agreement.thread.agentId}`).emit('profile:ratingUpdated', {
        userId: agreement.thread.agentId,
        rating: agentRating,
        reviewCount,
    })

    getIO().to(`thread:${agreement.threadId}`).emit('thread:completed', {
        threadId: agreement.threadId,
        agreementId,
    })

    await notify({
        userId: agreement.thread.agentId,
        type: NotificationType.DEAL_COMPLETED,
        body: 'Your agreement has been completed',
        metadata: { agreementId, threadId: agreement.threadId }
    })

    await notify({
        userId: agreement.thread.agentId,
        type: NotificationType.RATING_RECEIVED,
        body: `You received a ${rating.score}-star rating`,
        metadata: { reviewerId: clientId, threadId: agreement.threadId, score: rating.score }
    })

    await notify({
        userId: agreement.thread.clientId,
        type: NotificationType.DEAL_COMPLETED,
        body: 'Your agreement has been completed',
        metadata: { agreementId, threadId: agreement.threadId }
    })

}