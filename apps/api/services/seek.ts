import { Prisma } from '@prisma/client'
import { prisma } from '@kiwi/db'
import { SeekStatus } from '@kiwi/types'
import type { CreateSeekInput, SeekFeedQuery } from '@kiwi/types'
import { formatLocation } from '../utils/sorting.js'

export async function createSeek(userId: string, data: CreateSeekInput) {
    const seek = await prisma.$transaction(async (tx: any) => {


        const location = data.location 
            ?  formatLocation(data.location) 
            : null


        const created = await tx.seek.create({
            data: {
                auathorId: userId,
                content: data.content,
                type: data.type,
                propertyType: data.propertyType ?? null,
                budget: data.budget ?? null,
                location: location,
                urgency: data.urgency ?? null,
                rooms: data.rooms,
                isSingle: data.isSingle ?? null,
                hasPets: data.hasPets ?? null,
                expiresAt: data.expiresAt ?? null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        roles: true,
                        profile: {
                            select: {
                                avaterUrl: true,
                                location: true,
                                rating: true,
                                verificationStatus: true,
                            }
                        },

                    }
                }
            }
        })
        await tx.profile.update({
            where: { userId },
            data: { requests: { increment: 1 } }
        })

        return created
    })

        return seek
}


export async function createReseek(userId: string, seekId: string, content: string) {
    const originalSeek = await prisma.seek.findUnique({  where: { id: seekId } })
    if (!originalSeek) throw new Error('Seek not found')

        const existing = await prisma.seekReseek.findUnique({
            where: { seekId_userId: { seekId, userId }}
        })
        if (existing) throw new Error('Already reseeked')

        const reseek = await prisma.$transaction(async (tx: any) => {
            const created = await tx.seek.create({
                data: {
                    authorId: userId,
                    content,
                    type: originalSeek.propertyType,
                    budget: originalSeek.budget,
                    location: originalSeek.location,
                    urgency: originalSeek.urgency,
                    rooms: originalSeek.rooms,
                    isReseek: true,
                    originalSeekId: seekId,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            roles: true,
                            profile: {
                                select: {
                                    avatarUrl: true,
                                    location: true,
                                    rating: true
                                }
                            }
                        }
                    }
                }
            })

            await tx.seekReseek.create({
                data: { seekId, userId }
            })

            await tx.seek.update({
                where: { id: seekId },
                data: { ressekCount: { increment: 1 } }
            })

            await tx.profile.update({
                where: { userId },
                data: { requests: { increment: 1 } }
            })
            return created
        })
            return reseek
}



export async function getSeekFeed(query: SeekFeedQuery) {
  const limit = query.limit ?? 20

  const where = {
    status: SeekStatus.OPEN,
    ...(query.type && { type: query.type }),
    ...(query.propertyType && { propertyType: query.propertyType }),
    ...(query.location && { location: { startsWith: query.location } }),
    ...(query.urgency && { urgency: query.urgency }),
    ...(query.rooms && { rooms: query.rooms }),
    ...(query.isSingle !== undefined && { isSingle: query.isSingle }),
    ...(query.hasPets !== undefined && { hasPets: query.hasPets }),
    ...((query.minBudget || query.maxBudget) && {
      budget: {
        ...(query.minBudget && { gte: query.minBudget }),
        ...(query.maxBudget && { lte: query.maxBudget }),
      }
    }),
  }

  const seeks = await prisma.seek.findMany({
    take: limit + 1,
    ...(query.cursor && {
      skip: 1,
      cursor: { id: query.cursor }
    }),
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          roles: true,
          profile: {
            select: {
              avatarUrl: true,
              location: true,
              rating: true,
            }
          }
        }
      },
      _count: {
        select: {
          bids: true,
          likes: true,
          reseeks: true,
          comments: true,
          bookmarks: true,
        }
      }
    }
  })

  const hasNextPage = seeks.length > limit
  const data = hasNextPage ? seeks.slice(0, -1) : seeks
  const nextCursor = hasNextPage ? data[data.length - 1].id : null

  return { data, nextCursor, hasNextPage }
}

export async function getSeekById(seekId: string) {
    const seek = await prisma.seek.finUnique({
        where: { seekId },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    roles: true,
                    profile: {
                        select: {
                            avatarUrl: true,
                            location: true,
                            rating: true,
                            completedDeals: true,
                            reviewCount: true,
                            comments: true,
                        }
                    }
                }
            },
                   _count: {
                select: {
                    bids: true,
                    likes: true,
                    reseeks: true,
                    comments: true,
                    bookmarks: true,
                }
            }
        }
    })
        if (!seek) throw new Error('Seek not found')
            return seek
}

export async function deleteSeek(seekId: string, userId: string) {
    const seek = await prisma.seek.findUnique({ where: { id: seekId }})

    if (!seek) throw new Error('Seek not found')
    if (seek.authorId !== userId) throw new Error('Unauthorized')

        await prisma.$transaction([
            prisma.seek.delete({ where: { id: seekId } }),
            prisma.profile.update({
                where : { userId },
                data: { requests: { decrement: 1 } }
            })
        ])
}


export async function addComment(seekId: string, userId: string, content: string) {
    const seek = await prisma.seek.findUnique({ where: { id: userId }})
    if (!seek) throw new Error('Seek not found')
        if (!seek.commentsEnabled) throw new Error('Comments are disabled on this seek')

            const comment = await prisma.$transaction(async (tx: any) => {
                const created = await tx.seekComment.create({
                    data: { seekId, userId, content },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profile: {
                                    select: {
                                         avatarUrl: true
                                    }
                                }
                            }
                        }
                    }
                })
                await tx.seek.update({
                    where: { id: seekId },
                    data: { commentCount: { Increment: 1 } }
                })
                return created
            })
                return comment
}


export async function getComments(seekId: string) {
    const seek = await prisma.seek.findUnique({ where: { id: seekId } })
    if (!seek) throw new Error('Seek not found')

        return prisma.seekComment.findMany({
            where: { seekId },
            orderBy: {  createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profile: {
                            select: { avaatrUrl: true }
                        }
                    }
                }
            }
        })
}

export async function deleteComment(commentId: string, userId: string) {
    const comment = await prisma.seekComment.findUnique({ where: { id: commentId } })
    if (!comment) throw new Error('Comment not founc')
    if (comment.userId !== userId) throw new Error('Unauthorized')

        await prisma.$transaction([
            prisma.seekComment.delete({ where: { id: commentId } }),
            prisma.seek.update({
                where: { id: comment.seekId },
                data: { commentCount: { decerement: 1 }}
            })
        ])
}

export async function toggleComments(seekId: string, userId: string) {
    const seek = await prisma.seekComment.findUnique({ where: { id: seekId } })
    if (!seek) throw new Error('Seek not founc')
    if (seek.userId !== userId) throw new Error('Unauthorized')

        
            return prisma.seek.update({
                where: { id: seekId },
                data: { commentsEnabled: !seek.commentsEnabled }
            })
}