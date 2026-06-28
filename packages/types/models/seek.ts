import { SeekType, SeekStatus, PropertyType, UrgencyLevel } from '../enums/seek.js'

export interface CreateSeekInput {
  content: string
  originalSeekId?: string
  isReseek: boolean
  type: SeekType
  propertyType?: PropertyType
  budget?: number
  location: string
  urgency?: UrgencyLevel
  rooms: number
  isSingle?: boolean
  hasPets?: boolean
  expiresAt?: Date
}

export interface SeekFeedQuery {
  cursor?: string
  limit?: number
  type?: SeekType
  propertyType?: PropertyType
  location?: string
  minBudget?: number
  maxBudget?: number
  urgency?: UrgencyLevel
  rooms?: number
}
export interface Seek {
  id: string
  originalSeekId?: string
  isReseek: boolean
  authorId: string
  content: string
  type: SeekType
  status: SeekStatus
  budget?: number
  location: string
  urgency?: string
  bidCount: number
  likeCount: number
  restackCount: number
  createdAt: Date
}