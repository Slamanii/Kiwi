import { prisma } from '@kiwi/db'
import { CreateCommunityInput, CommunityRole, CommunityCategory, NotificationType } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from './notification.js'

export async function createCommunity(
    creatorId: string,
    data: CreateCommunityInput
) {
    const community = await prisma.$transaction(async (tx: any) => {
        const created = await tx.community.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                avatarUrl: data.avatarUrl ?? null,
                creatorId,
                isPrivate: data.isPrivate ?? false,
                type: data.type ?? 'STANDARD',
                category: data.category ?? 'GENERAL',
                requireApproval: data.requireApproval ?? false,
                memberCount: 1,
                lastMessageAt: new Date(),
            }
        })
        await tx.communityMember.create({
            data: {
                communityId: created.id,
                userId: creatorId,
                role: CommunityRole.ADMIN
            }
        })

        return created

    })

    getIO().to(`user:${creatorId}`).emit('community:created', community)

    return community
}

export async function joinCommunity(communityId: string, userId: string) {
    const existing = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } }
    })
    if (existing) throw new Error('Already a member')

    const community = await prisma.community.findUnique({ where: { id: communityId } })
    if (!community) throw new Error('Community not found')

    if (community.requireApproval) {
        const existingRequest = await prisma.communityJoinRequest.findUnique({
            where: { communityId_userId: { communityId, userId } }
        })
        if (existingRequest?.status === 'PENDING') throw new Error('Request already pending')

        const request = existingRequest
            ? await prisma.communityJoinRequest.update({
                where: { id: existingRequest.id },
                data: { status: 'PENDING', createdAt: new Date(), respondedAt: null }
            })
            : await prisma.communityJoinRequest.create({
                data: { communityId, userId }
            })

        const admins = await prisma.communityMember.findMany({
            where: { communityId, role: CommunityRole.ADMIN },
            select: { userId: true }
        })
        const requester = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
        await Promise.all(admins.map(admin => notify({
            userId: admin.userId,
            type: NotificationType.COMMUNITY_JOIN_REQUEST,
            body: `${requester?.name ?? 'Someone'} requested to join ${community.name}`,
            metadata: { communityId }
        })))

        return { status: 'REQUESTED' as const, request }
    }

    const [membership] = await prisma.$transaction([
        prisma.communityMember.create({
            data: { communityId, userId, role: CommunityRole.MEMBER }
        }),
        prisma.community.update({
            where: { id: communityId },
            data: { memberCount: { increment: 1 } }
        })
    ])

    getIO().to(`community:${communityId}`).emit('community:memberJoined', { userId })

    return { status: 'JOINED' as const, membership }
}

export async function getJoinRequests(communityId: string, adminUserId: string) {
    await assertAdmin(communityId, adminUserId)

    return prisma.communityJoinRequest.findMany({
        where: { communityId, status: 'PENDING' },
        include: { user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } },
        orderBy: { createdAt: 'asc' }
    })
}

export async function acceptJoinRequest(communityId: string, requestId: string, adminUserId: string) {
    await assertAdmin(communityId, adminUserId)

    const request = await prisma.communityJoinRequest.findUnique({ where: { id: requestId } })
    if (!request || request.communityId !== communityId) throw new Error('Request not found')
    if (request.status !== 'PENDING') throw new Error('Request already resolved')

    const [, , membership] = await prisma.$transaction([
        prisma.communityJoinRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED', respondedAt: new Date() }
        }),
        prisma.community.update({
            where: { id: communityId },
            data: { memberCount: { increment: 1 } }
        }),
        prisma.communityMember.create({
            data: { communityId, userId: request.userId, role: CommunityRole.MEMBER }
        })
    ])

    getIO().to(`community:${communityId}`).emit('community:memberJoined', { userId: request.userId })

    const community = await prisma.community.findUnique({ where: { id: communityId }, select: { name: true } })
    await notify({
        userId: request.userId,
        type: NotificationType.COMMUNITY_JOIN_ACCEPTED,
        body: `Your request to join ${community?.name ?? 'the community'} was accepted`,
        metadata: { communityId }
    })

    return membership
}

export async function declineJoinRequest(communityId: string, requestId: string, adminUserId: string) {
    await assertAdmin(communityId, adminUserId)

    const request = await prisma.communityJoinRequest.findUnique({ where: { id: requestId } })
    if (!request || request.communityId !== communityId) throw new Error('Request not found')
    if (request.status !== 'PENDING') throw new Error('Request already resolved')

    await prisma.communityJoinRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED', respondedAt: new Date() }
    })

    const community = await prisma.community.findUnique({ where: { id: communityId }, select: { name: true } })
    await notify({
        userId: request.userId,
        type: NotificationType.COMMUNITY_JOIN_DECLINED,
        body: `Your request to join ${community?.name ?? 'the community'} was declined`,
        metadata: { communityId }
    })
}

export async function toggleRequireApproval(communityId: string, adminUserId: string, value: boolean) {
    await assertAdmin(communityId, adminUserId)

    return prisma.community.update({
        where: { id: communityId },
        data: { requireApproval: value }
    })
}

export async function updateCommunityAvatar(communityId: string, adminUserId: string, avatarUrl: string) {
    await assertAdmin(communityId, adminUserId)

    return prisma.community.update({
        where: { id: communityId },
        data: { avatarUrl }
    })
}

export async function getMyCommunities(userId: string, cursor?: string, limit = 50) {
    const memberships = await prisma.communityMember.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { communityId_userId: { communityId: cursor, userId } } }),
        where: { userId },
        orderBy: { community: { lastMessageAt: 'desc' } },
        select: {
            role: true,
            community: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    avatarUrl: true,
                    memberCount: true,
                    messagingMode: true,
                    type: true,
                    category: true,
                    requireApproval: true,
                    lastMessage: true,
                    lastMessageAt: true,
                    createdAt: true,
                }
            }
        }
    })

    const hasMore = memberships.length > limit
    if (hasMore) memberships.pop()

    return {
        communities: memberships.map(m => ({ ...m.community, currentUserRole: m.role })),
        nextCursor: hasMore ? memberships[memberships.length - 1].community.id : null
    }
}

async function assertAdmin(communityId: string, userId: string) {
    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } }
    })
    if (!membership || membership.role !== CommunityRole.ADMIN) throw new Error('Admin access required')
}

export async function promoteMemberToAdmin(communityId: string, targetUserId: string, requesterId: string) {
    await assertAdmin(communityId, requesterId)

    const target = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: targetUserId } }
    })
    if (!target) throw new Error('User is not a member of this community')
    if (target.role === CommunityRole.ADMIN) throw new Error('User is already an admin')

    return prisma.communityMember.update({
        where: { communityId_userId: { communityId, userId: targetUserId } },
        data: { role: CommunityRole.ADMIN }
    })
}

export async function leaveCommunity(communityId: string, userId: string) {
    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } },
        select: { role: true }
    })
    if (!membership) throw new Error('You are not a member of this community')
        
   if (membership.role === CommunityRole.ADMIN) {
    const otherAdmins = await prisma.communityMember.count({
        where: { communityId, role: CommunityRole.ADMIN, userId: { not: userId } }
    })
    if (otherAdmins === 0) throw new Error('Assign another admin before leaving')
   }

   await prisma.$transaction([
    prisma.communityMember.delete({
        where: { communityId_userId: { communityId, userId } }
    }),
    prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } }
    })
   ])

   getIO().to(`community:${communityId}`).emit('community:memberLeft', { userId })
    
}

export async function getCommunityMembers(communityId: string, cursor?: string, limit = 50) {
    const members = await prisma.communityMember.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { communityId_userId: { communityId, userId: cursor } } }),
        where: { communityId },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    verificationStatus: true,
                    profile: { select: { avatarUrl: true } }
                }
            }
        }
    })

    const hasMore = members.length > limit
    if (hasMore) members.pop()

    return {
        members: members.map(m => ({
            ...m,
            user: {
                ...m.user,
                profile: m.user.profile
                    ? { ...m.user.profile, verificationStatus: m.user.verificationStatus }
                    : m.user.profile
            }
        })),
        nextCursor: hasMore ? members[members.length - 1].userId : null
    }
}

async function attachMembership<T extends { id: string }>(communities: T[], userId?: string) {
    if (!userId || communities.length === 0) {
        return communities.map(c => ({ ...c, currentUserRole: null as CommunityRole | null, isMember: false }))
    }

    const memberships = await prisma.communityMember.findMany({
        where: { userId, communityId: { in: communities.map(c => c.id) } },
        select: { communityId: true, role: true }
    })
    const roleByCommunity = new Map(memberships.map(m => [m.communityId, m.role]))

    return communities.map(c => ({
        ...c,
        currentUserRole: roleByCommunity.get(c.id) ?? null,
        isMember: roleByCommunity.has(c.id),
    }))
}

export async function getCommunities(cursor?: string, limit = 50, type?: 'STANDARD' | 'MARKETPLACE', category?: CommunityCategory, userId?: string) {
    const communities = await prisma.community.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: {
            ...(type && { type }),
            ...(category && { category })
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            memberCount: true,
            messagingMode: true,
            type: true,
            category: true,
            requireApproval: true,
            lastMessage: true,
            lastMessageAt: true,
            createdAt: true,
        }
    })

    const hasMore = communities.length > limit
    if (hasMore) communities.pop()

    return {
        communities: await attachMembership(communities, userId),
        nextCursor: hasMore ? communities[communities.length - 1].id : null
    }
}

export async function getCommunityById(communityId: string, userId: string) {
    const community = await prisma.community.findUnique({
        where: { id: communityId },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            verificationStatus: true,
                            profile: { select: { avatarUrl: true } }
                        }
                    }
                }
            },
            messages: {
                take: 30,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profile: { select: { avatarUrl: true } }
                        }
                    }
                }
            }
        }
    })

    if (!community) throw new Error('community not found')

    const membership = community.members.find(m => m.userId === userId )

    return {
        ...community,
        members: community.members.map(m => ({
            ...m,
            user: {
                ...m.user,
                profile: m.user.profile
                    ? { ...m.user.profile, verificationStatus: m.user.verificationStatus }
                    : m.user.profile
            }
        })),
        messages: community.messages.reverse(),
        currentUserRole: membership?.role ?? null,
        currentUserCanPost: membership?.canPost ?? false,
        isMember: !!membership,
    }
}

export async function searchCommunities(query: string, cursor?: string, limit = 20, type?: 'STANDARD' | 'MARKETPLACE', category?: CommunityCategory, userId?: string) {
    const communities = await prisma.community.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: {
            name: { contains: query, mode: 'insensitive' },
            ...(type && { type }),
            ...(category && { category })
        },
        orderBy: { memberCount: 'desc' },
        select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            memberCount: true,
            messagingMode: true,
            type: true,
            category: true,
            requireApproval: true,
            lastMessageAt: true,
        }
    })

    const hasMore = communities.length > limit
    if (hasMore) communities.pop()

    return {
        communities: await attachMembership(communities, userId),
        nextCursor: hasMore ? communities[communities.length - 1].id : null
    }
}