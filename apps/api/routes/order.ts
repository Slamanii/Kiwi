import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  createOrder,
  getCommunityOrders,
  removeOrder,
  followUpOnOrder,
  completeOrder,
  orderFulfilled,
  reviewOrder,
  disputeOrder,
  getMyStoreConversations,
  getCommunityStoreConversations,
  getOrderConversationMessages,
  sendOrderMessage,
  markOrderConversationRead,
} from '../services/order.js'

const router = Router()

const createOrderSchema = z.object({
  items: z.array(z.object({
    listingId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  description: z.string().optional(),
})

const followUpSchema = z.object({
  content: z.string().min(1),
})

const reviewSchema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
})

const orderMessageSchema = z.object({
  content: z.string().min(1),
  replyToId: z.string().optional(),
})

// buyer places an order (queues into the community's admin-only order panel)
router.post('/:communityId', requireAuth, async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const order = await createOrder(userId, req.params.communityId, parsed.data.items, parsed.data.description)
    return res.status(201).json(order)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// admin-only order panel for a community
router.get('/community/:communityId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const cursor = req.query.cursor as string | undefined
    const limit = req.query.limit ? Number(req.query.limit) : undefined
    const result = await getCommunityOrders(req.params.communityId, userId, cursor, limit)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
})

// buyer cancels their own pending order
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await removeOrder(req.params.id, userId)
    return res.status(200).json({ message: 'Order cancelled' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// admin responds to a queued order - lazily opens/reuses the store conversation
router.post('/:id/follow-up', requireAuth, async (req: Request, res: Response) => {
  const parsed = followUpSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const message = await followUpOnOrder(req.params.id, userId, parsed.data.content)
    return res.status(201).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// admin marks an order complete - decrements stock, updates community deal stats
router.patch('/:id/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const order = await completeOrder(req.params.id, userId)
    return res.status(200).json(order)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// admin convenience: complete the oldest open order against a given listing
router.patch('/listing/:listingId/fulfilled', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const order = await orderFulfilled(req.params.listingId, userId)
    return res.status(200).json(order)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// buyer reviews the store after an order is completed
router.post('/:id/review', requireAuth, async (req: Request, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const review = await reviewOrder(req.params.id, userId, parsed.data.score, parsed.data.comment)
    return res.status(201).json(review)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// buyer's alternative to a review - flags the completed order as unsatisfactory
router.post('/:id/dispute', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const order = await disputeOrder(req.params.id, userId)
    return res.status(200).json(order)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// buyer's inbox of store conversations (only ones an admin has already opened)
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const conversations = await getMyStoreConversations(userId)
    return res.status(200).json(conversations)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// admin-only list of every buyer conversation for a store
router.get('/conversations/community/:communityId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const conversations = await getCommunityStoreConversations(req.params.communityId, userId)
    return res.status(200).json(conversations)
  } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
})

// get messages in a store conversation (buyer or store admin only)
router.get('/conversation/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const result = await getOrderConversationMessages(req.params.id, userId, cursor)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// mark a store conversation as read (buyer or store admin only)
router.patch('/conversation/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await markOrderConversationRead(req.params.id, userId)
    return res.status(200).json({ message: 'Messages marked as read' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// reply in an already-open store conversation
router.post('/conversation/:id', requireAuth, async (req: Request, res: Response) => {
  const parsed = orderMessageSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const message = await sendOrderMessage(req.params.id, userId, parsed.data)
    return res.status(201).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

export default router
