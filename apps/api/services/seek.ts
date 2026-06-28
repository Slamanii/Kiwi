import { getIO } from '../utils/socket.js'
import { prisma } from '@kiwi/db'
import type { Prisma } from '@prisma/client'
import { SeekStatus, NotificationType, SeekType, UserRole,  } from '@kiwi/types'
import type { CreateSeekInput, SeekFeedQuery } from '@kiwi/types'
import { formatLocation } from '../utils/sorting.js'
import { notify } from './notification.js'


export async function createSeek(userId: string, data: CreateSeekInput) {
    const seek = await prisma.$transaction(async (tx: any) => {

        if (data.type === SeekType.INFO) {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { roles: true }
            })
            const allowed = [UserRole.AGENT, UserRole.LAWYER, UserRole.DEVELOPER]
            const hasRole = user?.roles.some((r) => allowed.includes(r as typeof UserRole.AGENT | typeof UserRole.LAWYER | typeof UserRole.DEVELOPER))
            if (!hasRole) throw new Error('Only agents, lawyers and developers can post info')
        }

        const isInfoPost = data.type === SeekType.INFO
        const location = !isInfoPost && data.location ? formatLocation(data.location) : null

        const created = await tx.seek.create({
    data: {
        authorId: userId,
        content: data.content,
        type: data.type,
        propertyType: isInfoPost ? null : (data.propertyType ?? null),
        budget: isInfoPost ? null : (data.budget ?? null),
        location: isInfoPost ? null : location,
        urgency: isInfoPost ? null : (data.urgency ?? null),
        rooms: isInfoPost ? null : (data.rooms ?? null),
        isSingle: isInfoPost ? null : (data.isSingle ?? null),
        hasPets: isInfoPost ? null : (data.hasPets ?? null),
        expiresAt: isInfoPost ? null : (data.expiresAt ?? null),
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
                                rating: true,
                                verificationStatus: true,
                            }
                        },
                    }
                }
            }
        })

        if (!isInfoPost) {
            await tx.profile.update({
                where: { userId },
                data: { requests: { increment: 1 } }
            })
        }

        return created
    })

    getIO().emit('seek:new', {
        id: seek.id,
        type: seek.type,
        location: seek.location,
        budget: seek.budget,
        urgency: seek.urgency,
        author: seek.author
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
                data: { reseekCount: { increment: 1 } }
            })

            await tx.profile.update({
                where: { userId },
                data: { requests: { increment: 1 } }
            })
            return created
        })

    getIO().emit('seek:new', {
        id: reseek.id,
        type: reseek.type,
        location: reseek.location,
        budget: reseek.budget,
        urgency: reseek.urgency,
        author: reseek.author
    })

            return reseek
}



export async function getSeekFeed(query: SeekFeedQuery) {
  const limit = query.limit ?? 20
const where: Prisma.SeekWhereInput = {
  status: { in: [SeekStatus.OPEN, SeekStatus.SELECTING] },
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
    const seek = await prisma.seek.findUnique({
        where: { id: seekId },
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
    const seek = await prisma.seek.findUnique({ where: { id: seekId }})
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
                    data: { commentCount: { increment: 1 } }
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
                            select: { avatarUrl: true }
                        }
                    }
                }
            }
        })
}

export async function deleteComment(commentId: string, userId: string) {
    const comment = await prisma.seekComment.findUnique({ where: { id: commentId } })
    if (!comment) throw new Error('Comment not found')
    if (comment.userId !== userId) throw new Error('Unauthorized')

        await prisma.$transaction([
            prisma.seekComment.delete({ where: { id: commentId } }),
            prisma.seek.update({
                where: { id: comment.seekId },
                data: { commentCount: { decrement: 1 }}
            })
        ])
}

export async function toggleComments(seekId: string, userId: string) {
    const seek = await prisma.seek.findUnique({ where: { id: seekId } })
    if (!seek) throw new Error('Seek not found')
    if (seek.authorId !== userId) throw new Error('Unauthorized')

        
            return prisma.seek.update({
                where: { id: seekId },
                data: { commentsEnabled: !seek.commentsEnabled }
            })
}

export async function likeSeek(userId: string, seekId: string) {
    const seek = await prisma.seek.findUnique({ 
        where: { id: seekId }
    })
    if (!seek) throw new Error('Seek not found')

        const existing = await prisma.seekLike.findUnique({
            where: { seekId_userId: { seekId, userId } }
        })

        if (existing) {
            await prisma.$transaction([
                prisma.seekLike.delete({
                    where: { seekId_userId: { seekId, userId } }
                }),
                prisma.seek.update({
                    where: { id: seekId },
                    data: { likeCount: { decrement: 1 } }
                })
            ])
            getIO().to(`seek:${seekId}`).emit('seek:liked', {
                seekId,
                liked: false,
                likeCount: seek.likeCount - 1
            })

            return { liked: false }
        }

        const [, updatedSeek] = await prisma.$transaction([
            prisma.seekLike.create({ data: { seekId, userId } }),
            prisma.seek.update({
                where: { id: seekId },
                data: { likeCount: { increment: 1 } },
                select: { likeCount: true }
            })
        ])

        getIO().to(`seek:${seekId}`).emit('seek:liked', {
            seekId,
            liked: true,
            likeCount: updatedSeek.likeCount
        })

        if (seek.authorId !== userId) {
            await notify({
                userId: seek.authorId,
                type: NotificationType.SYSTEM,
                title: 'Someone liked your seek',
                body: 'Your seek just got a like',
                metadata: { seekId }
            })
        }

        return { liked: true, likeCount: updatedSeek.likeCount }
}

export async function bookmarkSeek(userId: string, seekId: string) {
    const seek = await prisma.seek.findUnique({ where: { id: seekId }})
    if (!seek) throw new Error('seek not found')

        const existing = await prisma.seekBookmark.findUnique({
            where: { seekId_userId: { seekId, userId } }
        })

    if (existing) {
        await prisma.seekBookmark.delete({
            where: { seekId_userId: { seekId, userId } }
        })
        return { bookmarked: false }
    }

    await prisma.seekBookmark.create({ data: { seekId, userId } })
    return { bookmark: true }
}

export async function getBookmarks(userId: string) {
    const bookmarks = await prisma.seekBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            seek: {
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
                    }
                }
              }
            }
        }
    })
    return bookmarks.map(b => b.seek)
}

export async function getLikedSeeks(userId: string) {
    const likes = await prisma.seekLike.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            seek: {
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
                        }
                    }
                }
            }
        }
    })

    return likes.map(like => like.seek)
}