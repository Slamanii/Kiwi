import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { getProfile, updateProfile } from '../services/profile.js'


const router = Router()

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    location: z.string().optional(),
    zone: z.string().optional(),
    rate: z.number().positive().optional(),
    inspectionFee: z.number().positive().optional(),
    policyNote: z.string().optional(),
})


router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
        const profile = await getProfile(req.params.userId)
        return res.status(200).json(profile)
        } catch (err: any) {
            return res.status(404).json({ error: err.message })
        }
})

router.put('/', requireAuth, async (req: Request, res: Response) => {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const userId = req.user?.userId as string
        const result = await updateProfile(userId, parsed.data)
        return res.status(200).json(result)
    } catch(err: any) {
        return res.status(400).json({ error: err.message })
    }
})

export default router