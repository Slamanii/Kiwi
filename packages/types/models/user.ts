import { UserRole } from '../enums/user.js'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole[]
  isVerified: boolean
  createdAt: Date
}

export interface UpdateProfileInput {
  name?: string
  phone?: string
  bio?: string
  avatarUrl?: string
  location?: string
  zone?: string
  rate?: number
  inspectionFee?: number
  policyNote?: string
}