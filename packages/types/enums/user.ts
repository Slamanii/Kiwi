export const UserRole = {
  CLIENT: 'CLIENT',
  AGENT: 'AGENT',
  LAWYER: 'LAWYER',
  DEVELOPER: 'DEVELOPER'
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED'
} as const
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus]

export const SubscriptionTier = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM'
} as const
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier]
