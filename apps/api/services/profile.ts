import { prisma } from '@kiwi/db'
import { UserRole, UpdateProfileInput, BankDetailsInput, VerificationStatus, NotificationType, AgreementStatus } from '@kiwi/types'
import { verifyAccountWithPaystack, createPaystackRecipient } from './paystack.js'
import  { notify } from './notification.js'

export type AgentProfileFilters = {
    location?: string
    minRate?: number
    maxRate?: number
    minRating?: number
    verifiedOnly?: boolean
    cursor?: string
    limit?: number
}

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    })
    if (!user) throw new Error('User not found')

    const isAgent = user.roles.includes(UserRole.AGENT)

    const { passwordHash, resetToken, ...safeUser } = user

    return {
        ...safeUser,
        profile: isAgent
            ? user.profile
            : {
                id: user.profile?.id,
                userId: user.profile?.userId,
                bio: user.profile?.bio,
                avatarUrl: user.profile?.avatarUrl,
                location: user.profile?.location,
                createdAt: user.profile?.createdAt,
                updatedAt: user.profile?.updatedAt,
            }
    }
}


export async function updateProfile(userId: string, data: UpdateProfileInput) {
    const { name, phone, bio, avatarUrl, location, zone, rate, policyNote, inspectionFee } = data

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    })
    if (!user) throw new Error('User not found')
    if (!user.profile) throw new Error('Profile not found')

        const isAgent = user.roles.includes(UserRole.AGENT)

        const profileData: any = {
            bio: bio ?? undefined,
            avatarUrl: avatarUrl ?? undefined,
            location: location ?? undefined,
        }

        if (isAgent) {
            profileData.zone = zone ?? undefined,
            profileData.rate = rate ?? undefined,
            profileData.policyNote = policyNote ?? undefined,
            profileData.inspectionFee = inspectionFee ?? undefined
        }
        const [updatedProfile] = await prisma.$transaction([
            prisma.profile.update({
                where: { userId },
                data: 
                    profileData                    
                
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    name: name ?? undefined,
                    phone: phone ?? undefined,
                }
            })
        ])

        return updatedProfile
}

export async function updateBankDetails(userId: string, data: BankDetailsInput) {
    const { accountNumber, bankCode, accountName } = data

    const verified = await verifyAccountWithPaystack(accountNumber, bankCode) 
    if (!verified) throw new Error('Could not verify bank account')

        const recipientCode = await createPaystackRecipient({
            accountNumber,
            bankCode,
            accountName,
        })

        return prisma.user.update({
            where: {id: userId },
            data: {
                accountNumber,
                bankCode,
                accountName,
                paystackRecipientCode: recipientCode
            }
        })
}

export async function getAgentProfiles(filters: AgentProfileFilters = {}) {
    const { location, minRate, maxRate, minRating, cursor, verifiedOnly, limit = 20 } = filters 

    const agents = await prisma.user.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor }}),
        where: {
            roles: { has: UserRole.AGENT },
            profile: {
                ...(location && { location: { contains: location, mode: 'insensitive' } }),
                ...(minRate !== undefined && { rate: { gte: minRate } }),
                ...(maxRate !== undefined && { rate: { lte: maxRate } }),
                ...(minRating !== undefined && { rating: { gte: minRating } }),
                ...(verifiedOnly && { verificationStatus: VerificationStatus.VERIFIED})
            }
        },
        select: {
            id: true,
            name: true,
            profile: {
                select: {
                    avatarUrl: true,
                    location: true,
                    rate: true,
                    rating: true,
                    verificationStatus: true,
                    policyNote: true,
                    inspectionFee: true,
                }
            }
        },
        orderBy: { profile: { rating: 'desc' } }
    })

    const hasMore = agents.length > limit
    if (hasMore) agents.pop()

        return {
            agents,
            nextCursor: hasMore ? agents[agents.length - 1].id : null
        }
}


export async function searchUsers(query: string, limit = 20) {
    return prisma.user.findMany({
        take: limit,
        where: {
            name: { contains: query, mode: 'insensitive' }
        },
        select: {
            id: true,
            name: true,
            roles: true,
            profile: {
                select: {
                    avatarUrl: true,
                    verificationStatus: true,
                }
            }
        }
    })
}

export async function submitRating(
    reviewerId: string,
    agentId: string,
    threadId: string,
    data: { score: number; comment?: string }
) {
    if (data.score < 1 || data.score > 5) throw new Error('Score must be between 1 and 5')

    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: { agreement: true }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== reviewerId) throw new Error('Only the client can submit a rating')
    if (![AgreementStatus.COMPLETED, AgreementStatus.DISPUTED].includes(thread.status)) {
        throw new Error('Thread must be completed or disputed before submitting a rating')
    }

    const existing = await prisma.review.findUnique({ where: { threadId } })
    if (existing) throw new Error('You have already rated this agent for this transaction')

    const review = await prisma.$transaction(async (tx: any) => {
        const created = await tx.review.create({
            data: {
                reviewerId,
                agentId,
                threadId,
                score: data.score,
                comment: data.comment ?? null,
            }
        })

        const { _avg, _count } = await tx.review.aggregate({
            where: { agentId },
            _avg: { score: true },
            _count: { score: true }
        })

        await tx.profile.update({
            where: { userId: agentId },
            data: {
                rating: _avg.score ?? 3.5,
                reviewCount: _count.score
            }
        })

        return created
    })

    await notify({
        userId: agentId,
        type: NotificationType.RATING_RECEIVED,
        title: "Rating just in",
        body: `You received a ${data.score}-star rating`,
        metadata: { reviewerId, threadId, score: data.score }
    })

    return review
}

export async function getRatings(agentId: string, limit = 20) {
    return prisma.review.findMany({
        take: limit,
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            score: true,
            createdAt: true,
            reviewer: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            }
        }
    })
}

export async function getReviews(agentId: string, cursor?: string, limit = 10) {
    const reviews = await prisma.review.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: { agentId, comment: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            score: true,
            comment: true,
            createdAt: true,
            reviewer: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            }
        }
    })

    const hasMore = reviews.length > limit
    if (hasMore) reviews.pop()

    return {
        reviews,
        nextCursor: hasMore ? reviews[reviews.length - 1].id : null
    }
}

export async function submitSystemReview(userId: string, data: { score: number; comment?: string }) {
    if (data.score < 1 || data.score > 5) throw new Error('Score must be between 1 and 5')

    return prisma.systemReview.create({
        data: { userId, score: data.score, comment: data.comment ?? null }
    })
}

export async function getSystemReviews(cursor?: string, limit = 20) {
    const reviews = await prisma.systemReview.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true }
            }
        }
    })

    const hasMore = reviews.length > limit
    if (hasMore) reviews.pop()

    return {
        reviews,
        nextCursor: hasMore ? reviews[reviews.length - 1].id : null
    }
}