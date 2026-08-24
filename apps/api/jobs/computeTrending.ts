// apps/api/src/jobs/computeTrending.ts
import { prisma, SeekType, UrgencyLevel } from '@kiwi/db'
import cron from 'node-cron'

const SEEK_INCLUDE = {
    author: {
        select: {
            id: true,
            name: true,
            roles: true,
            verificationStatus: true,
            profile: {
                select: {
                    avatarUrl: true,
                    location: true,
                    rating: true,
                }
            }
        }
    },
    originalSeek: {
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            }
        }
    }
}

async function computeTrending() {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24) // 24h
    const since7d = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) // 7d for INFO

    const trends: {
        category: any
        headline: string
        count: number
        location?: string
        propertyType?: any
        urgency?: string
        rooms?: number
        seekIds: string[]
    }[] = []

    // ── 1 & 2. Top 2 property types ──────────────────────────────
    const byPropertyType = await prisma.seek.groupBy({
        by: ['propertyType'],
        where: {
            createdAt: { gte: since },
            type: { not: SeekType.INFO },
            propertyType: { not: null }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 2
    })

    for (const group of byPropertyType) {
        if (!group.propertyType) continue
        const seeks = await prisma.seek.findMany({
            where: {
                createdAt: { gte: since },
                propertyType: group.propertyType,
                type: { not: SeekType.INFO }
            },
            orderBy: { likeCount: 'desc' },
            take: 100,
            select: { id: true }
        })
        const label = group.propertyType.replace(/_/g, ' ').toLowerCase()
        trends.push({
            category: 'PROPERTY_TYPE',
            headline: `${group._count.id} people seeking ${label}s today`,
            count: group._count.id,
            propertyType: group.propertyType,
            seekIds: seeks.map(s => s.id)
        })
    }

    // ── 3. Top location ───────────────────────────────────────────
    const byLocation = await prisma.seek.groupBy({
        by: ['location'],
        where: {
            createdAt: { gte: since },
            type: { not: SeekType.INFO },
            location: { not: null }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1
    })

    if (byLocation[0]?.location) {
        const loc = byLocation[0]
        const seeks = await prisma.seek.findMany({
            where: {
                createdAt: { gte: since },
                location: { contains: loc.location!, mode: 'insensitive' },
                type: { not: SeekType.INFO }
            },
            orderBy: { likeCount: 'desc' },
            take: 100,
            select: { id: true }
        })
        trends.push({
            category: 'LOCATION',
            headline: `${loc._count.id} seeks active in ${loc.location} right now`,
            count: loc._count.id,
            location: loc.location!,
            seekIds: seeks.map(s => s.id)
        })
    }

    // ── 4. Urgency ────────────────────────────────────────────────
    const urgencyCount = await prisma.seek.count({
        where: {
            createdAt: { gte: since },
            urgency: UrgencyLevel.URGENT,
            type: { not: SeekType.INFO }
        }
    })

    if (urgencyCount > 0) {
        const seeks = await prisma.seek.findMany({
            where: {
                createdAt: { gte: since },
                urgency: UrgencyLevel.URGENT,
                type: { not: SeekType.INFO }
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: { id: true }
        })
        trends.push({
            category: 'URGENCY',
            headline: `${urgencyCount} urgent seeks need immediate attention`,
            count: urgencyCount,
            urgency: UrgencyLevel.URGENT,
            seekIds: seeks.map(s => s.id)
        })
    }

    // ── 5. Most requested room count ─────────────────────────────
    const byRooms = await prisma.seek.groupBy({
        by: ['rooms'],
        where: {
            createdAt: { gte: since },
            type: { not: SeekType.INFO },
            rooms: { not: null }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1
    })

    if (byRooms[0]?.rooms) {
        const roomGroup = byRooms[0]
        const seeks = await prisma.seek.findMany({
            where: {
                createdAt: { gte: since },
                rooms: roomGroup.rooms,
                type: { not: SeekType.INFO }
            },
            orderBy: { likeCount: 'desc' },
            take: 100,
            select: { id: true }
        })
        trends.push({
            category: 'ROOMS',
            headline: `${roomGroup._count.id} people looking for ${roomGroup.rooms}-bedroom properties`,
            count: roomGroup._count.id,
            rooms: roomGroup.rooms!,
            seekIds: seeks.map(s => s.id)
        })
    }

    // ── 6. INFO — most recent this week ──────────────────────────
    const infoRecentCount = await prisma.seek.count({
        where: { createdAt: { gte: since7d }, type: SeekType.INFO }
    })

    if (infoRecentCount > 0) {
        const seeks = await prisma.seek.findMany({
            where: { createdAt: { gte: since7d }, type: SeekType.INFO },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: { id: true }
        })
        trends.push({
            category: 'INFO',
            headline: `${infoRecentCount} housing updates shared this week`,
            count: infoRecentCount,
            seekIds: seeks.map(s => s.id)
        })
    }

    // ── 7. INFO — most liked (agent insights) ────────────────────
    const infoTopCount = await prisma.seek.count({
        where: { createdAt: { gte: since7d }, type: SeekType.INFO, likeCount: { gt: 0 } }
    })

    if (infoTopCount > 0) {
        const seeks = await prisma.seek.findMany({
            where: { createdAt: { gte: since7d }, type: SeekType.INFO, likeCount: { gt: 0 } },
            orderBy: { likeCount: 'desc' },
            take: 100,
            select: { id: true }
        })
        trends.push({
            category: 'INFO',
            headline: `Top ${Math.min(infoTopCount, 100)} market insights from agents`,
            count: infoTopCount,
            seekIds: seeks.map(s => s.id)
        })
    }

    // ── Persist ───────────────────────────────────────────────────
    await prisma.$transaction(async (tx: any) => {
        await tx.trending.deleteMany()

        for (const trend of trends) {
            await tx.trending.create({
                data: {
                    category: trend.category,
                    headline: trend.headline,
                    count: trend.count,
                    location: trend.location ?? null,
                    propertyType: trend.propertyType ?? null,
                    urgency: trend.urgency ?? null,
                    rooms: trend.rooms ?? null,
                    seeks: {
                        create: trend.seekIds.map(seekId => ({ seekId }))
                    }
                }
            })
        }
    })

    console.log(`[trending] computed ${trends.length} trends`)
}

// every 6 hours
cron.schedule('0 */6 * * *', computeTrending)

export { computeTrending }