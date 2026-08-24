export const UserRole = {
  CLIENT: 'CLIENT',
  AGENT: 'AGENT',
  DESIGNER: 'DESIGNER',
  DEVELOPER: 'DEVELOPER',
  ADMIN: 'ADMIN',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
} as const
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus]

export const SubscriptionTier = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
} as const
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier]
