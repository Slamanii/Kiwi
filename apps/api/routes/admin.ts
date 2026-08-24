import { Router, Request, Response } from 'express'
import { z } from 'zod'
import {
    getApplications,
    approveAgentApplication,
    rejectAgentApplication,
    getVerificationRequests,
    approveVerificationRequest,
    rejectVerificationRequest,
    promoteToAdmin,
    banUser,
    getDashboardStats,
} from '../services/admin.js'
import { searchUsers } from '../services/profile.js'
import { triggerReferralPayout } from '../services/referral.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { ApplicationStatus } from '@kiwi/types'

const router = Router()


router.get('/applications', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { status, cursor, limit } = req.query
        const result = await getApplications(
            status as ApplicationStatus | undefined,
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/applications/:id/approve', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        await approveAgentApplication(req.params.id)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/applications/:id/reject', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { reason } = req.body
        await rejectAgentApplication(req.params.id, reason)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/verifications', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { status, cursor, limit } = req.query
        const result = await getVerificationRequests(
            status as ApplicationStatus | undefined,
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/verifications/:id/approve', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        await approveVerificationRequest(req.params.id)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/verifications/:id/reject', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { reason } = req.body
        await rejectVerificationRequest(req.params.id, reason)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/users/search', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { query, limit } = req.query
        const result = await searchUsers(query as string ?? '', limit ? Number(limit) : undefined)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/users/:id/promote', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        await promoteToAdmin(req.params.id)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/users/:id/ban', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        await banUser(req.params.id)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/stats', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const result = await getDashboardStats()
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/referrals/:id/payout', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        await triggerReferralPayout(req.params.id)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

export default router