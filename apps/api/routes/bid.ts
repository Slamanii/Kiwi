import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  createBid,
  getBidsBySeek,
  getMyBids,
  getBidById,
  updateBidStatus,
  selectBid,
  withdrawBid,
} from '../services/bid.js'
import { BidStatus } from '@kiwi/types'

const router = Router()

const createBidSchema = z.object({
  seekId: z.string(),
  rate: z.number().positive(),
  message: z.string().min(10),
})

const updateStatusSchema = z.object({
  status: z.nativeEnum(BidStatus),
})

// create bid — agent only
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = createBidSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const agentId = req.user?.userId as string
    const result = await createBid(agentId, parsed.data)
    return res.status(201).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get all bids on a seek — seek author only
router.get('/seek/:seekId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const bids = await getBidsBySeek(req.params.seekId, userId)
    return res.status(200).json(bids)
  } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
})

// get my bids — agent only
router.get('/mine', requireAuth, async (req: Request, res: Response) => {
  try {
    const agentId = req.user?.userId as string
    const bids = await getMyBids(agentId)
    return res.status(200).json(bids)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get single bid
router.get('/:bidId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const bid = await getBidById(req.params.bidId, userId)
    return res.status(200).json(bid)
  } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
})

// update bid status — withdraw or reject
router.patch('/:bidId/status', requireAuth, async (req: Request, res: Response) => {
  const parsed = updateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const result = await updateBidStatus(req.params.bidId, userId, parsed.data.status)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// select bid — creates thread
router.post('/:bidId/select', requireAuth, async (req: Request, res: Response) => {
  try {
    const clientId = req.user?.userId as string
    const thread = await selectBid(req.params.bidId, clientId)
    return res.status(201).json(thread)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// withdraw bid — agent only
router.patch('/:bidId/withdraw', requireAuth, async (req: Request, res: Response) => {
  try {
    const agentId = req.user?.userId as string
    await withdrawBid(req.params.bidId, agentId)
    return res.status(200).json({ message: 'Bid withdrawn' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

export default router