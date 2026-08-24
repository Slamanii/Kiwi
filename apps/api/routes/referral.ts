import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getReferralStats, getMyReferrals } from '../services/referral.js'

const router = Router()

router.get('/stats', requireAuth, async (req, res) => {
    try {
        const result = await getReferralStats(req.user!.userId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/', requireAuth, async (req, res) => {
    try {
        const { cursor, limit } = req.query
        const result = await getMyReferrals(
            req.user!.userId,
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

export default router