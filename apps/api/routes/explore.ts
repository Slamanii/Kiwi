// apps/api/src/routes/explore.ts
import { Router } from 'express'
import { prisma } from '@kiwi/db'

const router = Router()

router.get('/trending', async (req, res) => {
    try {
        const trending = await prisma.trending.findMany({
            orderBy: { count: 'desc' },
            include: {
                seeks: {
                    take: 100,
                    include: {
                        seek: {
                            include: {
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
                        }
                    }
                }
            }
        })

        // flatten seeks out of junction
        const result = trending.map(t => ({
            id: t.id,
            category: t.category,
            headline: t.headline,
            count: t.count,
            location: t.location,
            propertyType: t.propertyType,
            urgency: t.urgency,
            rooms: t.rooms,
            computedAt: t.computedAt,
            seeks: t.seeks.map(ts => ({
                ...ts.seek,
                author: {
                    ...ts.seek.author,
                    profile: ts.seek.author.profile
                        ? { ...ts.seek.author.profile, verificationStatus: ts.seek.author.verificationStatus }
                        : ts.seek.author.profile
                }
            }))
        }))

        res.json(result)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router