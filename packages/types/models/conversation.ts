import { ConversationType } from '../enums/conversation.js'

export interface BlockedUser {
  id: string
  blockerId: string
  blockedId: string
  createdAt: Date
}

export interface ConversationPreference {
  id: string
  userId: string
  conversationType: ConversationType
  conversationId: string
  muted: boolean
  pinned: boolean
  pinnedAt?: Date
  createdAt: Date
  updatedAt: Date
}
