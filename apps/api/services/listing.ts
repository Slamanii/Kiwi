import { prisma } from '@kiwi/db'
import { CommunityRole, ListingType, ListingStatus, ListingCategory, ListingCondition } from '@kiwi/types'
import { getIO } from '../utils/socket.js'

export async function assertAdmin(communityId: string, userId: string) {
    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } }
    })
    if (!membership || membership.role !== CommunityRole.ADMIN) throw new Error('Admin access required')
}

export async function addListing(
    communityId: string,
    creatorId: string,
    data: {
        title: string
        description?: string
        price: number
        currency?: string
        images?: string[]
        type?: ListingType
        category?: ListingCategory
        condition?: ListingCondition
        location?: string
        stock?: number
    }
) {
    await assertAdmin(communityId, creatorId)

    const community = await prisma.community.findUnique({ where: { id: communityId }, select: { type: true } })
    if (!community) throw new Error('Community not found')
    if (community.type !== 'MARKETPLACE') throw new Error('Only marketplace communities can list items')

    const { listing, message } = await prisma.$transaction(async (tx: any) => {
        const created = await tx.listing.create({
            data: {
                communityId,
                creatorId,
                title: data.title,
                description: data.description ?? null,
                price: data.price,
                currency: data.currency ?? 'NGN',
                images: data.images ?? [],
                type: data.type ?? ListingType.FIXED,
                category: data.category ?? ListingCategory.OTHER,
                condition: data.condition ?? ListingCondition.NEW,
                location: data.location ?? null,
                status: ListingStatus.ACTIVE,
                stock: data.stock ?? 1,
            }
        })

        const firstImage = data.images?.[0]
        const isVideo = !!firstImage && /\.(mp4|mov|webm|m4v)$/i.test(firstImage)

        const createdMessage = await tx.communityMessage.create({
            data: {
                communityId,
                senderId: creatorId,
                type: isVideo ? 'VIDEO' : 'TEXT',
                content: created.title,
                mediaUrl: firstImage ?? null,
                listingId: created.id,
            },
            include: {
                sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                listing: { select: { id: true, title: true, description: true, price: true, currency: true, images: true } }
            }
        })

        await tx.community.update({
            where: { id: communityId },
            data: {
                lastMessage: `New listing: ${created.title}`,
                lastMessageAt: new Date(),
                listingCount: { increment: 1 }
            }
        })

        return { listing: created, message: createdMessage }
    })

    getIO().to(`community:${communityId}`).emit('message:new', message)

    return listing
}

export async function editListing(
    listingId: string,
    userId: string,
    data: Partial<{
        title: string
        description: string
        price: number
        currency: string
        images: string[]
        type: ListingType
        category: ListingCategory
        condition: ListingCondition
        location: string
        stock: number
        status: ListingStatus
    }>
) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new Error('Listing not found')
    await assertAdmin(listing.communityId, userId)

    const reactivating =
        listing.status === ListingStatus.SOLD_OUT &&
        (data.status === ListingStatus.ACTIVE || (data.stock !== undefined && data.stock > 0))

    return prisma.listing.update({
        where: { id: listingId },
        data: {
            ...data,
            ...(reactivating && { status: ListingStatus.ACTIVE, soldOutAt: null })
        }
    })
}

export async function delist(listingId: string, userId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new Error('Listing not found')
    await assertAdmin(listing.communityId, userId)
    if (listing.status === ListingStatus.REMOVED) throw new Error('Listing already delisted')

    const [updated] = await prisma.$transaction([
        prisma.listing.update({ where: { id: listingId }, data: { status: ListingStatus.REMOVED } }),
        prisma.community.update({ where: { id: listing.communityId }, data: { listingCount: { decrement: 1 } } })
    ])

    return updated
}

export async function setToSoldOut(listingId: string, userId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new Error('Listing not found')
    await assertAdmin(listing.communityId, userId)

    return prisma.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.SOLD_OUT, soldOutAt: new Date() }
    })
}

// Called when an order is marked completed (services/order.ts) - stock only moves once a sale is confirmed, not on order placement
export async function decrementStock(tx: any, listingId: string, quantity: number) {
    const listing = await tx.listing.update({
        where: { id: listingId },
        data: { stock: { decrement: quantity } }
    })

    if (listing.stock <= 0 && listing.status === ListingStatus.ACTIVE) {
        return tx.listing.update({
            where: { id: listingId },
            data: { status: ListingStatus.SOLD_OUT, soldOutAt: new Date() }
        })
    }

    return listing
}

export async function createFavorite(userId: string, listingId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new Error('Listing not found')

    return prisma.listingFavorite.upsert({
        where: { userId_listingId: { userId, listingId } },
        update: {},
        create: { userId, listingId }
    })
}

export async function removeFavorite(userId: string, listingId: string) {
    await prisma.listingFavorite.deleteMany({ where: { userId, listingId } })
}

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v)$/i.test(url)

export async function getListingById(listingId: string, userId: string) {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { community: { select: { id: true, name: true, avatarUrl: true, verificationStatus: true } } }
    })
    if (!listing || listing.status === ListingStatus.REMOVED) throw new Error('Listing not found')

    const favorite = await prisma.listingFavorite.findUnique({
        where: { userId_listingId: { userId, listingId } }
    })

    return { ...listing, favorited: !!favorite }
}

export async function getMyFavorites(userId: string) {
    const favorites = await prisma.listingFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            listing: {
                include: { community: { select: { id: true, name: true, avatarUrl: true, verificationStatus: true } } }
            }
        }
    })

    return favorites
        .filter(f => f.listing.status !== ListingStatus.REMOVED)
        .map(f => ({
            ...f.listing,
            favoritedAt: f.createdAt,
            media: f.listing.images.map(url => ({ type: isVideoUrl(url) ? 'video' as const : 'image' as const, url }))
        }))
}

// `scope` is a single discriminated filter-bar selection: the literal 'ALL', the literal
// 'JOINED' (communities the caller is a member of), or a communityId when the user searched/
// picked one specific store - the filter bar only ever has one of these active at a time, so
// there's no separate communityId param to conflict with it.
async function resolveScope(userId: string, scope: string) {
    if (scope === 'JOINED') return joinedCommunityIds(userId)
    if (scope === 'ALL') return undefined
    return [scope]
}

// Browse listings across the marketplace. category/condition/location are secondary filters
// layered on top of whichever scope is active.
export async function getListings(
    userId: string,
    options: {
        scope?: string
        category?: ListingCategory
        condition?: ListingCondition
        location?: string
        q?: string
        cursor?: string
        limit?: number
    } = {}
) {
    const { scope = 'ALL', category, condition, location, q, cursor, limit = 30 } = options

    const communityIds = await resolveScope(userId, scope)
    const isSpecificStore = scope !== 'ALL' && scope !== 'JOINED'

    const listings = await prisma.listing.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: {
            status: ListingStatus.ACTIVE,
            ...(communityIds && { communityId: { in: communityIds } }),
            ...(category && { category }),
            ...(condition && { condition }),
            ...(location && { location: { contains: location, mode: 'insensitive' } }),
            // strictly Listing.title/description — deliberately not joining into Community
            // fields, so a marketplace search never surfaces a group just because one of its
            // listings happens to match
            ...(q && {
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                ]
            })
        },
        orderBy: { createdAt: 'desc' },
        include: {
            community: { select: { id: true, name: true, avatarUrl: true, verificationStatus: true } }
        }
    })

    const hasMore = listings.length > limit
    if (hasMore) listings.pop()

    const favoriteIds = await prisma.listingFavorite.findMany({
        where: { userId, listingId: { in: listings.map(l => l.id) } },
        select: { listingId: true }
    })
    const favoritedSet = new Set(favoriteIds.map(f => f.listingId))
    const withFavorited = listings.map(l => ({ ...l, favorited: favoritedSet.has(l.id) }))

    // No specific store picked - shuffle within this page so the feed doesn't always surface
    // the same handful of stores' newest listings first. Cursor pagination still walks pages
    // in createdAt order underneath; only in-page display order is randomized.
    const ordered = isSpecificStore ? withFavorited : shuffle(withFavorited)

    return {
        listings: ordered,
        nextCursor: hasMore ? listings[listings.length - 1].id : null
    }
}

// Which categories actually have active listings in the given scope - drives which category
// chips the frontend shows, so switching All <-> Joined <-> a specific store can change the
// available options.
export async function getListingCategories(userId: string, scope: string = 'ALL') {
    const communityIds = await resolveScope(userId, scope)

    const grouped = await prisma.listing.groupBy({
        by: ['category'],
        where: {
            status: ListingStatus.ACTIVE,
            ...(communityIds && { communityId: { in: communityIds } })
        },
        _count: { _all: true }
    })

    return grouped
        .map(g => ({ category: g.category, count: g._count._all }))
        .sort((a, b) => b.count - a.count)
}

async function joinedCommunityIds(userId: string) {
    const memberships = await prisma.communityMember.findMany({
        where: { userId },
        select: { communityId: true }
    })
    return memberships.map(m => m.communityId)
}

function shuffle<T>(items: T[]): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}
