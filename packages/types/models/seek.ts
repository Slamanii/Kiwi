import { SeekType, SeekStatus, PropertyType, UrgencyLevel } from '../enums/seek.js'

export interface CreateSeekInput {
  content: string
  originalSeekId?: string
  isReseek: boolean
  type: SeekType
  propertyType?: PropertyType
  isShortlet?: boolean
  budget?: number
  currency?: string
  location?: string
  state?: string
  zone?: string
  city?: string
  urgency?: UrgencyLevel
  rooms?: number
  isSingle?: boolean
  hasPets?: boolean
  hasChildren?: boolean
  isStudent?: boolean
  worksFromHome?: boolean
  needsMortgage?: boolean
  hasLegalRep?: boolean
  allowsSingle?: boolean
  allowsPets?: boolean
  allowsChildren?: boolean
  isFurnished?: boolean
  hasParking?: boolean
  hasGenerator?: boolean
  hasWater?: boolean
  hasCofO?: boolean
  hasFlexiblePayment?: boolean
  expiresAt?: Date
}

export interface SeekFeedQuery {
  cursor?: string
  limit?: number
  authorId?: string
  type?: SeekType
  propertyType?: PropertyType
  isSingle?: boolean
  hasPets?: boolean
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