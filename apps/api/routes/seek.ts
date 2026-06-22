import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { createSeek, getSeekFeed, getSeekById, deleteSeek } from '../services/seek.js'
import { SeekType, PropertyType, UrgencyLevel } from '@kiwi/types'

const router = Router()

const createSeekSchema = z.object({
  content: z.string().min(10),
  type: z.nativeEnum(SeekType),
  propertyType: z.nativeEnum(PropertyType).optional(),
  budget: z.number().positive().optional(),
  location: z.string(),
  urgency: z.nativeEnum(UrgencyLevel).optional(),
  rooms: z.number().int().positive().optional(),
  isSingle: z.boolean().optional(),
  hasPets: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
})

const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  type: z.nativeEnum(SeekType).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  zone: z.string().optional(),
  minBudget: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxBudget: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  urgency: z.nativeEnum(UrgencyLevel).optional(),
  rooms: z.string().optional().transform(val => val ? parseInt(val) : undefined),
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

export default router