import { prisma } from '@kiwi/db'
import { ThreadStatus, AgreementStatus, BidStatus } from '@kiwi/types'

export async function getThreadsByUser(userId: string) {
    return prisma.thread.findMany({
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
                }
            }
        }
    })
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
    if (thread.agreement?.status === AgreementStatus.ESCROW_FUNDED) {
        throw new Error('Cannot close thread with active escrow')
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
            where: { userId: thread.agentId || thread.clientId },
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