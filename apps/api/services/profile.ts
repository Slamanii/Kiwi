import { prisma } from '@kiwi/db'
import { UserRole, UpdateProfileInput, BankDetailsInput, VerificationStatus, NotificationType, AgreementStatus, ApplicationStatus } from '@kiwi/types'
import { verifyAccountWithPaystack, createPaystackRecipient } from './paystack.js'
import  { notify } from './notification.js'
import { getIO } from '../utils/socket.js'


function mergeVerification<T extends { verificationStatus?: any; profile?: any }>(user: T) {
    const { verificationStatus, profile, ...rest } = user
    return { ...rest, profile: profile ? { ...profile, verificationStatus } : profile }
}

export type AgentProfileFilters = {
    search?: string
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
                requests: user.profile?.requests,
                ongoing: user.profile?.ongoing,
                completedDeals: user.profile?.completedDeals,
                reviewCount: user.profile?.reviewCount,
                rating: user.profile?.rating,
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
        profileData.zone = zone ?? undefined
        profileData.rate = rate ?? undefined
        profileData.policyNote = policyNote ?? undefined
        profileData.inspectionFee = inspectionFee ?? undefined
    }

    const [updatedProfile, updatedUser] = await prisma.$transaction([
        prisma.profile.update({
            where: { userId },
            data: profileData
        }),
        prisma.user.update({
            where: { id: userId },
            data: {
                name: name ?? undefined,
                phone: phone ?? undefined,
            }
        })
    ])

    getIO().to(`profile:${userId}`).emit('profile:updated', {
        userId,
        name: updatedUser.name,
        avatarUrl: updatedProfile.avatarUrl,
        location: updatedProfile.location,
        ...(isAgent && {
            zone: updatedProfile.zone,
            rate: updatedProfile.rate,
            policyNote: updatedProfile.policyNote,
            inspectionFee: updatedProfile.inspectionFee,
        })
    })

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

export async function submitVerificationRequest(
    userId: string,
    data: { nin: string; idType: string; idNumber: string; idDocumentUrl: string; selfieUrl: string }
) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (user.verificationStatus === VerificationStatus.VERIFIED) {
        throw new Error('You are already verified')
    }

    const existing = await prisma.verificationRequest.findFirst({
        where: { userId, status: ApplicationStatus.PENDING }
    })
    if (existing) throw new Error('You already have a pending verification request')

    const [request] = await prisma.$transaction([
        prisma.verificationRequest.create({ data: { userId, ...data } }),
        prisma.user.update({
            where: { id: userId },
            data: { verificationStatus: VerificationStatus.PENDING }
        })
    ])

    return request
}

export const MAX_CATALOG_ITEMS = 10

export async function getCatalog(userId: string) {
    const items = await prisma.catalogItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, url: true, type: true, caption: true, createdAt: true }
    })

    return { items }
}

export async function getCatalogItem(itemId: string) {
    const item = await prisma.catalogItem.findUnique({
        where: { id: itemId },
        select: { id: true, userId: true, url: true, type: true, caption: true, createdAt: true }
    })
    if (!item) throw new Error('Catalog item not found')

    return item
}

export async function addCatalogItem(userId: string, data: { url: string; type: 'IMAGE' | 'VIDEO'; caption?: string }) {
    const count = await prisma.catalogItem.count({ where: { userId } })
    if (count >= MAX_CATALOG_ITEMS) throw new Error('Catalog is full. Remove an item before adding a new one.')

    return prisma.catalogItem.create({
        data: {
            userId,
            url: data.url,
            type: data.type,
            caption: data.caption ?? null,
        }
    })
}

export async function updateCatalogItem(userId: string, itemId: string, caption?: string) {
    const item = await prisma.catalogItem.findUnique({ where: { id: itemId } })
    if (!item) throw new Error('Catalog item not found')
    if (item.userId !== userId) throw new Error('Not authorized to edit this catalog item')

    return prisma.catalogItem.update({
        where: { id: itemId },
        data: { caption: caption?.trim() || null }
    })
}

export async function deleteCatalogItem(userId: string, itemId: string) {
    const item = await prisma.catalogItem.findUnique({ where: { id: itemId } })
    if (!item) throw new Error('Catalog item not found')
    if (item.userId !== userId) throw new Error('Not authorized to delete this catalog item')

    await prisma.catalogItem.delete({ where: { id: itemId } })
    return { id: itemId }
}

export async function getAgentProfiles(filters: AgentProfileFilters = {}) {
    const { search, location, minRate, maxRate, minRating, cursor, verifiedOnly, limit = 20 } = filters

    const agents = await prisma.user.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor }}),
        where: {
            roles: { has: UserRole.AGENT },
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
            ...(verifiedOnly && { verificationStatus: VerificationStatus.VERIFIED }),
            profile: {
                ...(location && { location: { contains: location, mode: 'insensitive' } }),
                ...(minRate !== undefined && { rate: { gte: minRate } }),
                ...(maxRate !== undefined && { rate: { lte: maxRate } }),
                ...(minRating !== undefined && { rating: { gte: minRating } }),
            }
        },
        select: {
            id: true,
            name: true,
            verificationStatus: true,
            profile: {
                select: {
                    avatarUrl: true,
                    bio: true,
                    location: true,
                    zone: true,
                    rate: true,
                    rating: true,
                    policyNote: true,
                    inspectionFee: true,
                }
            }
        },
        orderBy: { profile: { rating: 'desc' } }
    })

    const hasMore = agents.length > limit
    if (hasMore) agents.pop()

    const shaped = agents.map(({ verificationStatus, profile, ...rest }) => ({
        ...rest,
        profile: profile ? { ...profile, verificationStatus } : profile
    }))

    return {
        agents: shaped,
        nextCursor: hasMore ? shaped[shaped.length - 1].id : null
    }
}


export async function searchUsers(query: string, limit = 20) {
    const users = await prisma.user.findMany({
        take: limit,
        where: {
            name: { contains: query, mode: 'insensitive' }
        },
        select: {
            id: true,
            name: true,
            roles: true,
            verificationStatus: true,
            profile: {
                select: {
                    avatarUrl: true,
                }
            }
        }
    })

    return users.map(({ verificationStatus, profile, ...rest }) => ({
        ...rest,
        profile: profile ? { ...profile, verificationStatus } : profile
    }))
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
    if (!thread.agreement || ![AgreementStatus.COMPLETED, AgreementStatus.DISPUTED].includes(thread.agreement.status as 'COMPLETED' | 'DISPUTED')) {
        throw new Error('Agreement must be completed or disputed before submitting a rating')
    }

    const existing = await prisma.review.findUnique({ where: { threadId } })
    if (existing) throw new Error('You have already rated this agent for this transaction')

    const { review, rating, reviewCount } = await prisma.$transaction(async (tx: any) => {
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

        return {
            review: created,
            rating: _avg.score ?? 3.5,
            reviewCount: _count.score
        }
    })

    getIO().to(`profile:${agentId}`).emit('profile:ratingUpdated', {
        userId: agentId,
        rating,
        reviewCount,
    })

    await notify({
        userId: agentId,
        type: NotificationType.RATING_RECEIVED,
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
                    verificationStatus: true,
                    profile: { select: { avatarUrl: true } }
                }
            }
        }
    })

    const hasMore = reviews.length > limit
    if (hasMore) reviews.pop()

    return {
        reviews: reviews.map(review => ({ ...review, reviewer: mergeVerification(review.reviewer) })),
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