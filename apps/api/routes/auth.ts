import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { signUp, login, approveAgentApplication, becomeAnAgent, resetPassword } from '../services/auth.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { UserRole } from '@kiwi/types'

const router = Router()

const signUpSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8)
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
})

const  becomeAnAgentSchema = z.object({
  zone: z.string().min(1),          
  rate: z.number().positive(),           
  policyNote: z.string().min(1),  
  nin: z.number().positive(),  
  idNumber: z.string().min(1),
    idType: z.string().min(1),
  idDocumentUrl: z.string(), 
  bio: z.string().optional(),
  phone: z.string().optional(), 
  agentReferralCode:z.string().optional(),
})



router.post('/signUp', async (req: Request, res: Response) => {
    const parsed = signUpSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await signUp(parsed.data)
        return res.status(201).json(result)
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    } 
})

router.post('/login', async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await login(parsed.data)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(401).json({ error: err.message })
    }
})


router.post('/approve-agent/:applicationId', requireAuth, requireRole([UserRole.DEVELOPER]), async (req: Request, res: Response) => {
  
    try {
        const result = await approveAgentApplication(req.params.applicationId)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(401).json({ error: err.message })
    }
})



router.post('/become-agent', requireAuth, async (req: Request, res: Response) => {
    const parsed = becomeAnAgentSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await becomeAnAgent({ 
            ...parsed.data,
            userId: req.user?.userId as string 
        })
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(401).json({ error: err.message })
    }
})


router.post('/resetPassword', requireAuth, async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await login(parsed.data)
        return res.status(200).json(result)
    } catch (err: any) {
        return res.status(401).json({ error: err.message })
    }
})

export default router