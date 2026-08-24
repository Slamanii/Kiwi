import { Router } from 'express'
import { getAgentProfiles } from '../services/profile.js'

const router = Router()

router.get('/', async (req, res) => {
    try {
        const { search, location, minRate, maxRate, minRating, verifiedOnly, cursor, limit } = req.query
        const result = await getAgentProfiles({
            search: search as string | undefined,
            location: location as string | undefined,
            minRate: minRate ? Number(minRate) : undefined,
            maxRate: maxRate ? Number(maxRate) : undefined,
            minRating: minRating ? Number(minRating) : undefined,
            verifiedOnly: verifiedOnly === 'true',
            cursor: cursor as string | undefined,
            limit: limit ? Number(limit) : undefined,
        })
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

export default router