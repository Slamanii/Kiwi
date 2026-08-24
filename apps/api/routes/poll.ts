import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { createPoll, votePoll, getPollResults, deletePoll } from '../services/poll.js'

const router = Router()

const createPollSchema = z.object({
    question: z.string().min(1).max(300),
    options: z.array(z.string().min(1).max(120)).min(2).max(8),
    allowMultiple: z.boolean().optional(),
    closesAt: z.string().datetime().optional(),
})

const voteSchema = z.object({
    optionIds: z.array(z.string()).min(1),
})

router.post('/:communityId', requireAuth, async (req: Request, res: Response) => {
    const parsed = createPollSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const userId = req.user?.userId as string
        const message = await createPoll(req.params.communityId, userId, parsed.data)
        return res.status(201).json(message)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.post('/:id/vote', requireAuth, async (req: Request, res: Response) => {
    const parsed = voteSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const userId = req.user?.userId as string
        const results = await votePoll(req.params.id, userId, parsed.data.optionIds)
        return res.status(200).json(results)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId as string
        const results = await getPollResults(req.params.id, userId)
        return res.status(200).json(results)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId as string
        const result = await deletePoll(req.params.id, userId)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

export default router
