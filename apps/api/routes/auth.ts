import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { signUp, login, becomeAnAgent, resetPassword, requestPasswordReset, verifyEmailUpdate, refreshToken, changePassword, requestEmailUpdate } from '../services/auth.js'
import { requireAuth } from '../middleware/auth.js'

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
  nin: z.string().length(11),
  idNumber: z.string().min(1),
  idType: z.string().min(1),
  idDocumentUrl: z.string(), 
  bio: z.string().optional(),
  phone: z.string().optional(), 
  accountNumber: z.string(),
  bankCode: z.string(),
  accountName: z.string(),
  agentReferralCode:z.string().optional(),
})

const requestResetSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
  resetToken: z.string(),
})



router.post('/register', async (req: Request, res: Response) => {
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
        return res.status(400).json({ error: err.message })
    }
})


router.post('/request-reset', async (req: Request, res: Response) => {
  const parsed = requestResetSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    await requestPasswordReset(parsed.data.email)
    return res.status(200).json({ message: 'If that email exists you will receive a reset link shortly' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post('/reset-password', async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const { email, newPassword, resetToken } = parsed.data
    await resetPassword(email, newPassword, resetToken)
    return res.status(200).json({ message: 'Password reset successfully' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})


// apps/api/src/routes/auth.ts (additions)

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken: token } = req.body
        if (!token) return res.status(400).json({ error: 'Refresh token required' })
        const tokens = await refreshToken(token)
        res.json(tokens)
    } catch (err: any) {
        console.error('[POST /auth/refresh]', err.message)
        res.status(401).json({ error: err.message })
    }
})

router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        await changePassword(req.user!.userId, { currentPassword, newPassword })
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.post('/update-email', requireAuth, async (req, res) => {
    try {
        const { email } = req.body
        await requestEmailUpdate(req.user!.userId, email)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query
        if (!token) return res.status(400).json({ error: 'Token required' })
        await verifyEmailUpdate(token as string)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})
export default router