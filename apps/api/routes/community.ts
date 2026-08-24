import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import {
    createCommunity,
    joinCommunity,
    leaveCommunity,
    getCommunities,
    getCommunityById,
    searchCommunities,
    getMyCommunities,
    getCommunityMembers,
    getJoinRequests,
    acceptJoinRequest,
    declineJoinRequest,
    toggleRequireApproval,
    updateCommunityAvatar,
    promoteMemberToAdmin,
} from '../services/community.js'
import {
    updateCommunityMessagingMode,
    toggleMemberPostPermission,
} from '../services/message.js'
import { CommunityMessagingMode, CommunityType, CommunityCategory } from '@kiwi/types'

const router = Router()

const modeSchema = z.object({ mode: z.nativeEnum(CommunityMessagingMode) })

const createCommunitySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    avatarUrl: z.string().optional(),
    isPrivate: z.boolean().optional(),
    type: z.nativeEnum(CommunityType).optional(),
    category: z.nativeEnum(CommunityCategory).optional(),
    requireApproval: z.boolean().optional(),
})

const requireApprovalSchema = z.object({ value: z.boolean() })
const avatarSchema = z.object({ avatarUrl: z.string().min(1) })

router.get('/', optionalAuth, async (req, res) => {
    try {
        const { cursor, limit, type, category } = req.query
        const result = await getCommunities(
            cursor as string | undefined,
            limit ? Number(limit) : undefined,
            type as 'STANDARD' | 'MARKETPLACE' | undefined,
            category as CommunityCategory | undefined,
            req.user?.userId
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/search', optionalAuth, async (req, res) => {
    try {
        const { q, cursor, limit, type, category } = req.query
        if (!q) return res.status(400).json({ error: 'Query is required' })
        const result = await searchCommunities(
            q as string,
            cursor as string | undefined,
            limit ? Number(limit) : undefined,
            type as 'STANDARD' | 'MARKETPLACE' | undefined,
            category as CommunityCategory | undefined,
            req.user?.userId
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/my', requireAuth, async (req, res) => {
    try {
        const { cursor, limit } = req.query
        const result = await getMyCommunities(
            req.user!.userId,
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.post('/', requireAuth, async (req, res) => {
    const parsed = createCommunitySchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await createCommunity(req.user!.userId, parsed.data)
        res.status(201).json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await getCommunityById(req.params.id, req.user!.userId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.post('/:id/join', requireAuth, async (req, res) => {
    try {
        const result = await joinCommunity(req.params.id, req.user!.userId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.delete('/:id/leave', requireAuth, async (req, res) => {
    try {
        await leaveCommunity(req.params.id, req.user!.userId)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/:id/members', requireAuth, async (req, res) => {
    try {
        const { cursor, limit } = req.query
        const result = await getCommunityMembers(
            req.params.id,
            cursor as string | undefined,
            limit ? Number(limit) : undefined
        )
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/members/:memberId/promote', requireAuth, async (req, res) => {
    try {
        const result = await promoteMemberToAdmin(req.params.id, req.params.memberId, req.user!.userId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.get('/:id/requests', requireAuth, async (req, res) => {
    try {
        const result = await getJoinRequests(req.params.id, req.user!.userId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.post('/:id/requests/:requestId/accept', requireAuth, async (req, res) => {
    try {
        const result = await acceptJoinRequest(req.params.id, req.params.requestId, req.user!.userId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.post('/:id/requests/:requestId/decline', requireAuth, async (req, res) => {
    try {
        await declineJoinRequest(req.params.id, req.params.requestId, req.user!.userId)
        res.json({ success: true })
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/require-approval', requireAuth, async (req, res) => {
    const parsed = requireApprovalSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await toggleRequireApproval(req.params.id, req.user!.userId, parsed.data.value)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/avatar', requireAuth, async (req, res) => {
    const parsed = avatarSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await updateCommunityAvatar(req.params.id, req.user!.userId, parsed.data.avatarUrl)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/mode', requireAuth, async (req, res) => {
    const parsed = modeSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
        const result = await updateCommunityMessagingMode(req.params.id, req.user!.userId, parsed.data.mode)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/members/:memberId/canPost', requireAuth, async (req, res) => {
    try {
        const result = await toggleMemberPostPermission(req.params.id, req.user!.userId, req.params.memberId)
        res.json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
})

export default router