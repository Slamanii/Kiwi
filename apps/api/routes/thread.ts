import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  getThreadsByUser,
  getThreadById,
  deleteThread,
  updateThreadStatus,
} from '../services/thread.js'
import {
  proposeAgreementFee,
  acceptAgreementFee,
  endNegotiation,
  answerAgreementItem,
  signAgreement,
  getAgreementByThread,
  completeAgreement,
  disputeAgreement,
} from '../services/agreement.js'
import { ThreadStatus, AgreementSentiment } from '@kiwi/types'
import { acceptTerms, endThread } from '../services/thread.js'
import { getThreadProgress, submitAssessment } from '../services/assessment.js'



const router = Router()

const proposeFeeSchema = z.object({
  agentFee: z.number().positive(),
})

const answerItemSchema = z.object({
  sentiment: z.nativeEnum(AgreementSentiment),
  answer: z.string().optional(),
})

const ratingSchema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
})

const endThreadSchema = z.object({
  reason: z.string().optional(),
  rating: ratingSchema.optional(),
})

const disputeSchema = z.object({
  reason: z.string().optional(),
})

// get all threads for current user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const threads = await getThreadsByUser(userId)
    return res.status(200).json(threads)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get single thread
router.get('/:threadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const thread = await getThreadById(req.params.threadId, userId)
    return res.status(200).json(thread)
  } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
})

// close thread
router.delete('/:threadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await deleteThread(req.params.threadId, userId)
    return res.status(200).json({ message: 'Thread closed' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// update thread status
router.patch('/:threadId/status', requireAuth, async (req: Request, res: Response) => {
  const parsed = z.object({ status: z.nativeEnum(ThreadStatus) }).safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const result = await updateThreadStatus(req.params.threadId, userId, parsed.data.status)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// propose/counter the agent fee
router.post('/:threadId/agreement/propose', requireAuth, async (req: Request, res: Response) => {
  const parsed = proposeFeeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const result = await proposeAgreementFee(req.params.threadId, userId, parsed.data.agentFee)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// accept the current agent fee proposal
router.post('/:threadId/agreement/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const result = await acceptAgreementFee(req.params.threadId, userId)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// end the fee negotiation (before an agreement is accepted)
router.post('/:threadId/agreement/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await endNegotiation(req.params.threadId, userId)
    return res.status(200).json({ message: 'Negotiation ended' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get agreement for thread
router.get('/:threadId/agreement', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const agreement = await getAgreementByThread(req.params.threadId, userId)
    return res.status(200).json(agreement)
  } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
})

// answer agreement item
router.patch('/agreement/items/:itemId', requireAuth, async (req: Request, res: Response) => {
  const parsed = answerItemSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const result = await answerAgreementItem(req.params.itemId, userId, parsed.data.sentiment, parsed.data.answer)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// sign agreement
router.post('/agreement/:agreementId/sign', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const result = await signAgreement(req.params.agreementId, userId)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// complete agreement
router.post('/agreement/:agreementId/complete', requireAuth, async (req: Request, res: Response) => {
  const parsed = ratingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const clientId = req.user?.userId as string
    await completeAgreement(req.params.agreementId, clientId, parsed.data)
    return res.status(200).json({ message: 'Agreement completed' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// dispute agreement
router.post('/agreement/:agreementId/dispute', requireAuth, async (req: Request, res: Response) => {
  const parsed = disputeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const userId = req.user?.userId as string
    const result = await disputeAgreement(req.params.agreementId, userId, parsed.data.reason)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})


// compliance
router.post('/:id/accept', requireAuth, async (req, res) => {
  const clientId = req.user?.userId as string
    await acceptTerms(req.params.id, clientId)
    res.json({ success: true })
})

// end thread
router.post('/:id/end', requireAuth, async (req, res) => {
    const parsed = endThreadSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
      const userId = req.user?.userId as string
      await endThread(req.params.id, userId, parsed.data.reason, parsed.data.rating)
      res.json({ success: true })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
})

// PA
router.get('/:id/assessment', requireAuth, async (req, res) => {
  const clientId = req.user?.userId as string
    const data = await getThreadProgress(req.params.id, clientId)
    res.json(data)
})

router.post('/:id/assessment', requireAuth, async (req, res) => {
    const clientId = req.user?.userId as string
    const { mood, healthTags, milestones, comment } = req.body
    await submitAssessment(req.params.id, clientId, { mood, healthTags, milestones, comment })
    res.json({ success: true })
})



export default router