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
}

export interface CreateCommunityInput {
  name: string
  description?: string
  avatarUrl?: string
  isPrivate?: boolean
}