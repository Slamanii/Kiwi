import { Router, Request, Response } from 'express'
import { prisma } from '@kiwi/db'
import { requireAuth } from '../middleware/auth.js'
import { getNotifications, markNotificationRead } from '../services/notification.js'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const { cursor, limit } = req.query
        const result = await getNotifications(
            req.user!.userId,
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/read-all', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId as string
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        })
        return res.status(200).json({ message: 'All marked as read' })
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
        const result = await markNotificationRead(req.params.id, req.user!.userId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

export default router