import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { submitSystemReview, getSystemReviews } from '../services/profile.js'

const router = Router()

router.post('/reviews', requireAuth, async (req, res) => {
    try {
        const { score, comment } = req.body
        const result = await submitSystemReview(req.user!.userId, { score, comment })
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/reviews', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { cursor, limit } = req.query
        const result = await getSystemReviews(
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

export default router