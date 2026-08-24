import { MessageType } from '../enums/messagetype.js'

export interface Message {
  id: string
  threadId: string
  senderId: string
  content: string
  createdAt: Date
}

export interface SendMessageInput {
  type?: MessageType
  content?: string
  mediaUrl?: string
  mediaSize?: number
  mediaDuration?: number
  fileName?: string
  replyToId?: string
}

export interface CreateCommunityInput {
  name: string
  description?: string
  avatarUrl?: string
  isPrivate?: boolean
  type?: 'STANDARD' | 'MARKETPLACE'
  category?: 'NEIGHBORHOOD' | 'REAL_ESTATE' | 'INTERIOR_DESIGN' | 'PROPERTY_INVESTMENT' | 'AGENTS_PROFESSIONALS' | 'STUDENT_HOUSING' | 'HOME_SERVICES' | 'GENERAL'
  requireApproval?: boolean
}