import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '@kiwi/db'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const tokenSchema = z.object({
    token: z.string().min(1)
})


router.post('/register', requireAuth, async (req: Request, res: Response) => {
    const parsed = tokenSchema.safeParse(req.body)
    
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const userId = req.user?.userId as string

        await prisma.deviceToken.upsert({
            where: { token: parsed.data.token },
            update: { userId },
            create: { userId, token: parsed.data.token }
        })

        return res.status(200).json({ message: 'device registered' })
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.post('/unregister', requireAuth, async (req: Request, res: Response) => {
    const parsed = tokenSchema.safeParse(req.body)

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        await prisma.deviceToken.deleteMany({
            where: { token: parsed.data.token }
        })

        return res.status(200).json({ message: 'Device unregistered' })
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

export default router 