import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { ConversationType } from '@kiwi/types'
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  setMuted,
  setPinned,
  setArchived,
  getConversationPreferences,
  getConversationMedia,
  searchConversationMessages,
  deleteMessages,
  setMessagePinned,
  setMessageArchived,
  getPinnedMessage,
  clearConversationMessages,
} from '../services/conversation.js'

const router = Router()

const toggleSchema = z.object({ value: z.boolean() })
const bulkDeleteSchema = z.object({ messageIds: z.array(z.string()).min(1) })

router.post('/users/:userId/block', requireAuth, async (req: Request, res: Response) => {
  try {
    const blockerId = req.user?.userId as string
    const blocked = await blockUser(blockerId, req.params.userId)
    return res.status(201).json(blocked)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/users/:userId/block', requireAuth, async (req: Request, res: Response) => {
  try {
    const blockerId = req.user?.userId as string
    await unblockUser(blockerId, req.params.userId)
    return res.status(200).json({ message: 'User unblocked' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.get('/users/blocked', requireAuth, async (req: Request, res: Response) => {
  try {
    const blockerId = req.user?.userId as string
    const blocked = await getBlockedUsers(blockerId)
    return res.status(200).json(blocked)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.get('/conversations/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const prefs = await getConversationPreferences(userId)
    return res.status(200).json(prefs)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/conversations/:type/:id/mute', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }
  const parsed = toggleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const userId = req.user?.userId as string
    const pref = await setMuted(userId, type as ConversationType, req.params.id, parsed.data.value)
    return res.status(200).json(pref)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/conversations/:type/:id/pin', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }
  const parsed = toggleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const userId = req.user?.userId as string
    const pref = await setPinned(userId, type as ConversationType, req.params.id, parsed.data.value)
    return res.status(200).json(pref)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/conversations/:type/:id/archive', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }
  const parsed = toggleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const userId = req.user?.userId as string
    const pref = await setArchived(userId, type as ConversationType, req.params.id, parsed.data.value)
    return res.status(200).json(pref)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.get('/conversations/:type/:id/media', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }

  try {
    const userId = req.user?.userId as string
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const result = await getConversationMedia(userId, type as ConversationType, req.params.id, cursor)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.get('/conversations/:type/:id/search', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }
  const query = typeof req.query.q === 'string' ? req.query.q : ''

  try {
    const userId = req.user?.userId as string
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const result = await searchConversationMessages(userId, type as ConversationType, req.params.id, query, cursor)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/conversations/:type/:id/messages/:messageId', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }

  try {
    const userId = req.user?.userId as string
    const result = await deleteMessages(userId, type as ConversationType, req.params.id, [req.params.messageId])
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/conversations/:type/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }
  const parsed = bulkDeleteSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const userId = req.user?.userId as string
    const result = await deleteMessages(userId, type as ConversationType, req.params.id, parsed.data.messageIds)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/conversations/:type/:id/messages/:messageId/pin', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }
  const parsed = toggleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const userId = req.user?.userId as string
    const message = await setMessagePinned(userId, type as ConversationType, req.params.id, req.params.messageId, parsed.data.value)
    return res.status(200).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.patch('/conversations/:type/:id/messages/:messageId/archive', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }
  const parsed = toggleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  try {
    const userId = req.user?.userId as string
    const message = await setMessageArchived(userId, type as ConversationType, req.params.id, req.params.messageId, parsed.data.value)
    return res.status(200).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.get('/conversations/:type/:id/pinned-message', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }

  try {
    const userId = req.user?.userId as string
    const message = await getPinnedMessage(userId, type as ConversationType, req.params.id)
    return res.status(200).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete('/conversations/:type/:id', requireAuth, async (req: Request, res: Response) => {
  const type = req.params.type.toUpperCase()
  if (!Object.values(ConversationType).includes(type as ConversationType)) {
    return res.status(400).json({ error: 'Invalid conversation type' })
  }

  try {
    const userId = req.user?.userId as string
    await clearConversationMessages(userId, type as ConversationType, req.params.id)
    return res.status(200).json({ message: 'Conversation cleared' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

export default router
