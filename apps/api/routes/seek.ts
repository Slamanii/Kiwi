import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { createSeek, getSeekFeed, getSeekById, deleteSeek, createReseek, toggleComments, deleteComment, getComments, addComment, bookmarkSeek, likeSeek, getBookmarks, getLikedSeeks, likeComment } from '../services/seek.js'
import { SeekType, PropertyType, UrgencyLevel } from '@kiwi/types'

const router = Router()

const createSeekSchema = z.object({
  content: z.string().min(10),
  type: z.nativeEnum(SeekType),
  originalSeekId: z.string().optional(),
  isReseek: z.boolean(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  isShortlet: z.boolean().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  city: z.string().optional(),
  urgency: z.nativeEnum(UrgencyLevel).optional(),
  rooms: z.number().int().positive().optional(),
  isSingle: z.boolean().optional(),
  hasPets: z.boolean().optional(),
  hasChildren: z.boolean().optional(),
  isStudent: z.boolean().optional(),
  worksFromHome: z.boolean().optional(),
  needsMortgage: z.boolean().optional(),
  hasLegalRep: z.boolean().optional(),
  allowsSingle: z.boolean().optional(),
  allowsPets: z.boolean().optional(),
  allowsChildren: z.boolean().optional(),
  isFurnished: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasGenerator: z.boolean().optional(),
  hasWater: z.boolean().optional(),
  hasCofO: z.boolean().optional(),
  hasFlexiblePayment: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
})

const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  authorId: z.string().optional(),
  type: z.nativeEnum(SeekType).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  location: z.string().optional(),
  minBudget: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxBudget: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  urgency: z.nativeEnum(UrgencyLevel).optional(),
  rooms: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  isSingle: z.string().optional().transform(val => 
    val === 'true' ? true : val === 'false' ? false : undefined
  ),
  hasPets: z.string().optional().transform(val => 
    val === 'true' ? true : val === 'false' ? false : undefined
  ),
})

const reseekSchema = z.object({
  content: z.string().min(10),
})

router.get('/bookmarks/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const bookmarks = await getBookmarks(userId)
    return res.status(200).json(bookmarks)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.get('/likes/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const liked = await getLikedSeeks(userId)
    return res.status(200).json(liked)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post('/:seekId/reseek', requireAuth, async (req: Request, res: Response) => {
  const parsed = reseekSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const result = await createReseek(userId, req.params.seekId, parsed.data.content)
    return res.status(201).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})
router.get('/', async (req: Request, res: Response) => {
  const parsed = feedQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const result = await getSeekFeed(parsed.data)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.get('/:seekId', requireAuth, async (req: Request, res: Response) => {
  try {
    const seek = await getSeekById(req.params.seekId)
    return res.status(200).json(seek)
  } catch (err: any) {
    return res.status(404).json({ error: err.message })
  }
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createSeekSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const result = await createSeek(userId, parsed.data)
    return res.status(201).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/:seekId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await deleteSeek(req.params.seekId, userId)
    return res.status(200).json({ message: 'Seek deleted' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})


router.get('/:seekId/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const comments = await getComments(req.params.seekId)
    return res.status(200).json(comments)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post('/:seekId/comments', requireAuth, async (req: Request, res: Response) => {
  const parsed = z.object({ content: z.string().min(1), parentId: z.string().optional() }).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const comment = await addComment(req.params.seekId, userId, parsed.data.content, parsed.data.parentId)
    return res.status(201).json(comment)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post('/comments/:commentId/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const result = await likeComment(req.params.commentId, userId)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})


router.delete('/comments/:commentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await deleteComment(req.params.commentId, userId)
    return res.status(200).json({ message: 'Comment deleted' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/:seekId/comments/toggle', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const result = await toggleComments(req.params.seekId, userId)
    return res.status(200).json({ commentsEnabled: result.commentsEnabled })
  } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
})

router.post('/:seekId/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const result = await likeSeek(userId, req.params.seekId)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post('/:seekId/bookmark', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const result = await bookmarkSeek(userId, req.params.seekId)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})






export default router


