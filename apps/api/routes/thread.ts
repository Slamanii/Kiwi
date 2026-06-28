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
  createAgreementForm,
  answerAgreementItem,
  signAgreement,
  getAgreementByThread,
  completeAgreement,
} from '../services/agreement.js'
import { ThreadStatus, AgreementStage } from '@kiwi/types'

const router = Router()

const createAgreementSchema = z.object({
  agentFee: z.number().positive(),
  items: z.array(z.object({
    requirement: z.string().min(1),
    stage: z.nativeEnum(AgreementStage),
  })).min(1),
})

const answerItemSchema = z.object({
  answer: z.string().min(1),
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

// create agreement form
router.post('/:threadId/agreement', requireAuth, async (req: Request, res: Response) => {
  const parsed = createAgreementSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const clientId = req.user?.userId as string
    const result = await createAgreementForm(req.params.threadId, clientId, parsed.data)
    return res.status(201).json(result)
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
    const result = await answerAgreementItem(req.params.itemId, userId, parsed.data.answer)
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
  try {
    const clientId = req.user?.userId as string
    await completeAgreement(req.params.agreementId, clientId)
    return res.status(200).json({ message: 'Agreement completed' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

export default router