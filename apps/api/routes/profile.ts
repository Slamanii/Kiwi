import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { getProfile, updateProfile, updateBankDetails, submitVerificationRequest, searchUsers, submitRating, getRatings, getReviews, getCatalog, getCatalogItem, addCatalogItem, deleteCatalogItem } from '../services/profile.js'


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

const catalogItemSchema = z.object({
    url: z.string().url(),
    type: z.enum(['IMAGE', 'VIDEO']),
    caption: z.string().max(1000).optional(),
})

const bankDetailsSchema = z.object({
    accountNumber: z.string().min(1),
    bankCode: z.string().min(1),
    accountName: z.string().min(1),
})

const verificationRequestSchema = z.object({
    nin: z.string().length(11),
    idType: z.string().min(1),
    idNumber: z.string().min(1),
    idDocumentUrl: z.string(),
    selfieUrl: z.string(),
})


// Registered before '/:userId' so literal paths like this one aren't
// swallowed by the single-segment catch-all below.
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId as string
        const profile = await getProfile(userId)
        return res.status(200).json(profile)
    } catch (err: any) {
        return res.status(404).json({ error: err.message })
    }
})

router.get('/search', async (req, res) => {
    try {
        const { q, limit } = req.query
        if (!q) return res.status(400).json({ error: 'Query is required' })
        const result = await searchUsers(q as string, limit ? Number(limit) : undefined)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})


router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
        const profile = await getProfile(req.params.userId)
        return res.status(200).json(profile)
        } catch (err: any) {
            return res.status(404).json({ error: err.message })
        }
})

router.patch('/', requireAuth, async (req: Request, res: Response) => {
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


router.patch('/bank', requireAuth, async (req: Request, res: Response) => {
    const parsed = bankDetailsSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const userId = req.user?.userId as string
        const result = await updateBankDetails(userId, parsed.data)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.post('/verify', requireAuth, async (req: Request, res: Response) => {
    const parsed = verificationRequestSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const userId = req.user?.userId as string
        const result = await submitVerificationRequest(userId, parsed.data)
        return res.status(201).json(result)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.get('/:id/ratings', async (req, res) => {
    try {
        const { limit } = req.query
        const result = await getRatings(
            req.params.id,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/:id/reviews', async (req, res) => {
    try {
        const { cursor, limit } = req.query
        const result = await getReviews(
            req.params.id,
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.post('/:id/rate', requireAuth, async (req, res) => {
    try {
        const { threadId, score, comment } = req.body
        const result = await submitRating(req.user!.userId, req.params.id, threadId, { score, comment })
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})


router.get('/:userId/catalog', requireAuth, async (req: Request, res: Response) => {
    try {
        const result = await getCatalog(req.params.userId)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.get('/catalog/:itemId', requireAuth, async (req: Request, res: Response) => {
    try {
        const result = await getCatalogItem(req.params.itemId)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(404).json({ error: err.message })
    }
})

router.post('/catalog', requireAuth, async (req: Request, res: Response) => {
    const parsed = catalogItemSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const userId = req.user?.userId as string
        const result = await addCatalogItem(userId, parsed.data)
        return res.status(201).json(result)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})

router.delete('/catalog/:itemId', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId as string
        const result = await deleteCatalogItem(userId, req.params.itemId)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
})



export default router