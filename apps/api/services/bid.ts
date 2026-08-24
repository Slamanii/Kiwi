import { BidStatus, SeekStatus, ThreadStatus, UserRole, NotificationType, AgreementStatus } from '@kiwi/types'
import { prisma } from '@kiwi/db'
import { CreateBidInput } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from './notification.js'


export async function createBid(agentId: string, data: CreateBidInput) {
    const user = await prisma.user.findUnique({ where: { id: agentId } })
    if (!user) throw new Error('user not found')
    if (!user.roles.includes(UserRole.AGENT)) throw new Error('Only agents can bid')

        const seek = await prisma.seek.findUnique({ where: { id: data.seekId } })
        if (!seek) throw new Error('Seek not found')
        if (seek.status !== SeekStatus.OPEN) throw new Error('Seek is no longer open')
        if (seek.authorId === agentId) throw new Error('Cannot bid on your own seek')

        const existing = await prisma.bid.findUnique({
            where: { seekId_agentId: { seekId: data.seekId, agentId } }
        })
        if (existing) throw new Error('Already bid on this seek')

            const bid = await prisma.$transaction(async (tx: any) => {
                const created = await tx.bid.create({
                    data: {
                        seekId: data.seekId,
                        agentId,
                        rate: data.rate,
                        amount: data.amount,
                        currency: data.currency ?? 'NGN',
                        message: data.message,
                        images: data.images ?? [],
                        videoUrl: data.videoUrl,
                    },
                    include: {
                        agent: {
                            select: {
                                id: true,
                                name: true,
                                roles: true,
                                profile: {
                                    select: {
                                        avatarUrl: true,
                                        rating: true,
                                        completedDeals: true,
                                        reviewCount: true,
                                        rate: true,
                                        policyNote: true,
                                        inspectionFee: true,
                                    }
                                } 
                            }
                        }
                    }
                })

                const updatedSeek = await tx.seek.update({
                    where: { id: data.seekId },
                    data: { bidCount: { increment: 1 } },
                    select: { bidCount: true, authorId: true }
                })

                return { created, updatedSeek } 
            })

            getIO().to(`seek:${data.seekId}`).emit('bid:count', {
                seekId: data.seekId,
                bidCount: bid.updatedSeek.bidCount
            })

            await notify({
                userId: bid.updatedSeek.authorId,
                type: NotificationType.NEW_BID,
                body: 'A new agent has bid on your seek',
                metadata: { seekId: data.seekId }
            })
            return bid
}

export async function getBidsBySeek(seekId: string, requestingUserId: string) {
    const seek = await prisma.seek.findUnique({ where: { id: seekId } })
    if (!seek) throw new Error('Seek not found')
        if(seek.authorId !== requestingUserId) throw new Error('unauthorized')

            return prisma.bid.findMany({
                where: { seekId },
                orderBy: { createdAt: 'desc' },
                include: {
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            roles: true,
                            profile: {
                                select: {
                                    avatarUrl: true,
                                    rating: true,
                                    completedDeals: true,
                                    reviewCount: true,
                                    rate: true,
                                    policyNote: true,
                                    inspectionFee: true,
                                    location: true,
                                }
                            }
                        }
                    }
                }
            })
}


export async function getMyBids(agentId: string) {
    return prisma.bid.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        include: {
            seek: {
                select: {
                    id: true,
                    content: true,
                    type: true,
                    status: true,
                    location: true,
                    budget: true,
                    urgency: true,
                    bidCount: true,
                    createdAt: true,
                    author: {
                        select: {
                            id: true,
                            name: true,
                            profile: {
                                select: { avatarUrl: true }
                            }
                        }
                    }
                }
            }
        }
    })
}



export async function getReceivedBids(userId: string) {
    return prisma.bid.findMany({
        where: { seek: { authorId: userId } },
        orderBy: { createdAt: 'desc' },
        include: {
            seek: {
                select: { id: true, content: true, type: true, location: true, budget: true }
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    profile: {
                        select: { avatarUrl: true, rating: true, reviewCount: true }
                    }
                }
            }
        }
    })
}

export async function getBidById(bidId: string, requestingUserId: string) {
    const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: {
            seek: true,
            agent: {
                select: {
                    id: true,
                    name: true,
                    profile: {
                        select: {
                            avatarUrl: true,
                            rating: true,
                            completedDeals: true,
                        }
                    }
                }
            }
        }
    })

    if (!bid) throw new Error('Bid not found')

    const isSeekAuthor = bid.seek.authorId === requestingUserId
    const isBiddingAgent = bid.agentId === requestingUserId
    if (!isSeekAuthor && !isBiddingAgent) throw new Error('Unauthorized')

        return bid

}
export async function updateBidStatus(
    bidId: string,
    userId: string,
    newStatus: BidStatus
) {
    const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: { seek: true }
    })

 if (!bid) throw new Error('Bid not found')
 if (bid.status !== BidStatus.PENDING) throw new Error('Bid is no longer pending')

 if (newStatus === BidStatus.WITHDRAWN && bid.agentId !== userId) {
    throw new Error('Unauthorized')
 }

 if (newStatus === BidStatus.REJECTED && bid.seek.authorId !== userId) {
    throw new Error('Unauthorized')
 }

 if (newStatus === BidStatus.SELECTED) {
    throw new Error('Use selectBid to select an agent')
 }
  return prisma.bid.update({
    where: { id: bidId },
    data: { status: newStatus }
  })
}

export async function selectBid(bidId: string, clientId: string) {
    const bid = await prisma.bid.findUnique({ 
        where: { id: bidId },
        include: { seek: true }
    })

    if (!bid) throw new Error('Bid not found')
    if (bid.seek.authorId !== clientId) throw new Error('Unauthorized')
    if (bid.status !== BidStatus.PENDING) throw new Error('Bid is no longer pending')
    if (bid.seek.status === SeekStatus.CLOSED) throw new Error('Seek is closed')

        const activeThreadCount = await prisma.thread.count({
            where: { seekId: bid.seekId }
        })
        if (activeThreadCount >= 5) throw new Error('Maximum of 5 agents already selected')


        const thread = await prisma.$transaction(async (tx: any) => {
            await tx.bid.update({
                where: { id: bidId },
                data: { status: BidStatus.SELECTED }
            })

        const thread = await tx.thread.create({
            data: {
                seekId: bid.seekId,
                clientId,
                agentId: bid.agentId,
                status: ThreadStatus.ACTIVE,
            }
        })

        await tx.profile.update({
            where: { userId: bid.agentId },
            data: {  ongoing: { increment: 1 }}
        })

        await tx.agreement.create({
            data: {
                threadId: thread.id,
                agentFee: bid.amount,
                proposedBy: bid.agentId,
                status: AgreementStatus.PENDING,
            }
        })

        const threadCount = await tx.thread.count({
            where: { seekId: bid.seekId }
        })

        if (threadCount >= 5) {
            await tx.seek.update({
                where: { id: bid.seekId },
                data: { status: SeekStatus.SELECTING }
            })
        }
         return thread
        })

    const profile = await prisma.profile.findUnique({ where: { userId: bid.agentId } })
        getIO().to(`profile:${bid.agentId}`).emit('profile:statsUpdated', {
        userId: bid.agentId,
        requests: profile?.requests,
        ongoing: profile?.ongoing,
        completedDeals: profile?.completedDeals,
    })

     getIO().to(`seek:${bid.seekId}`).emit('seek:bidSelected', {
        seekId: bid.seekId,
        threadId: thread.id,
        agentId: bid.agentId,
    })
    
    getIO().to(`user:${clientId}`).emit('thread:new', thread)
    
    getIO().to(`user:${bid.agentId}`).emit('thread:new', thread)


    // after thread is created and agent is notified of bid selection:
    await Promise.all([
      notify({
        userId: bid.agentId,
        type: NotificationType.COMPLIANCE_REQUIRED,
        body: 'A thread has been opened. Accept the compliance terms to unlock messaging.',
        metadata: { threadId: thread.id }
    }),
    notify({
        userId: clientId,
        type: NotificationType.COMPLIANCE_REQUIRED,
        body: 'You selected a bid. Accept the compliance terms to start messaging.',
        metadata: { threadId: thread.id }
    }),
    notify({
        userId: clientId,
        type: NotificationType.AGREEMENT_SENT,
        body: `The agent proposed a fee of ₦${bid.amount.toLocaleString()} for this deal.`,
        metadata: { threadId: thread.id }
    })
])

         return thread
}


export async function withdrawBid(bidId: string, agentId: string) {
    const bid = await prisma.bid.findUnique({ where: { id: bidId } })
    if (!bid) throw new Error('Bid not found')
    if (bid.agentId !== agentId) throw new Error('Unauthorized')
    if (bid.status != BidStatus.PENDING) throw new Error('Bid is no longer pending')

        return prisma.$transaction(async (tx: any) => {
            await tx.bid.update({
                where: { id: bidId },
                data: { status: BidStatus.WITHDRAWN }
            })

            await tx.seek.update({
                where: { id: bid.seekId },
                data: { bidCount: { decrement: 1 } }
            })
        })
}