import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  sendMessage,
  sendDM,
  markMessagesRead,
  getUnreadCount,
  sendCommunityMessage,
  getThreadMessages,
  getDMMessages,
  getDMConversations,
  markDMRead,
  getCommunityMessages,
} from '../services/message.js'
import { createCommunity } from '../services/community.js'
import { MessageType } from '@kiwi/types'

const router = Router()

const messageSchema = z.object({
  type: z.nativeEnum(MessageType).optional(),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaSize: z.number().optional(),
  mediaDuration: z.number().optional(),
  fileName: z.string().optional(),
  replyToId: z.string().optional(),
}).refine(data => data.content || data.mediaUrl, {
  message: 'Message must have content or media'
})

const dmSchema = z.object({
  receiverId: z.string(),
  type: z.nativeEnum(MessageType).optional(),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaSize: z.number().optional(),
  mediaDuration: z.number().optional(),
  fileName: z.string().optional(),
  replyToId: z.string().optional(),
}).refine(data => data.content || data.mediaUrl, {
  message: 'Message must have content or media'
})

const communitySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  isPrivate: z.boolean().optional(),
})

// send message in thread
router.post('/thread/:threadId', requireAuth, async (req: Request, res: Response) => {
  const parsed = messageSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const senderId = req.user?.userId as string
    const message = await sendMessage(req.params.threadId, senderId, parsed.data)
    return res.status(201).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// send DM
router.post('/dm', requireAuth, async (req: Request, res: Response) => {
  const parsed = dmSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const senderId = req.user?.userId as string
    const { receiverId, ...data } = parsed.data
    const message = await sendDM(senderId, receiverId, data)
    return res.status(201).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get messages in thread
router.get('/thread/:threadId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const result = await getThreadMessages(req.params.threadId, userId, cursor)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// list caller's DM conversations
router.get('/dm', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const conversations = await getDMConversations(userId)
    return res.status(200).json(conversations)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get DM messages with a user
router.get('/dm/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const result = await getDMMessages(userId, req.params.userId, cursor)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// mark DM conversation as read
router.patch('/dm/:conversationId/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await markDMRead(req.params.conversationId, userId)
    return res.status(200).json({ message: 'Messages marked as read' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get messages in community
router.get('/community/:communityId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
    const result = await getCommunityMessages(req.params.communityId, userId, cursor)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// mark messages read in thread
router.patch('/thread/:threadId/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    await markMessagesRead(req.params.threadId, userId)
    return res.status(200).json({ message: 'Messages marked as read' })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// get unread count
router.get('/unread', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId as string
    const count = await getUnreadCount(userId)
    return res.status(200).json(count)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// send community message
router.post('/community/:communityId', requireAuth, async (req: Request, res: Response) => {
  const parsed = messageSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const senderId = req.user?.userId as string
    const message = await sendCommunityMessage(req.params.communityId, senderId, parsed.data)
    return res.status(201).json(message)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})


// create community
router.post('/community', requireAuth, async (req: Request, res: Response) => {
  const parsed = communitySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const creatorId = req.user?.userId as string
    const community = await createCommunity(creatorId, parsed.data)
    return res.status(201).json(community)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

export default router