export const CommunityRole = {
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER'
} as const
export type CommunityRole =  (typeof CommunityRole)[keyof typeof CommunityRole]

export const  CommunityMessagingMode = {
  ADMIN_ONLY: 'ADMIN_ONLY',
  ALL_MEMBERS: 'ALL_MEMBERS',
  SELECTED_MEMBERS: 'SELECTED_MEMBERS'
} as const
export type CommunityMessagingMode = (typeof CommunityMessagingMode)[keyof typeof CommunityMessagingMode]

export const CommunityType = {
    STANDARD: 'STANDARD',
    MARKETPLACE: 'MARKETPLACE'
} as const
export type CommunityType = (typeof CommunityType)[keyof typeof CommunityType]

export const CommunityCategory = {
    NEIGHBORHOOD: 'NEIGHBORHOOD',
    REAL_ESTATE: 'REAL_ESTATE',
    INTERIOR_DESIGN: 'INTERIOR_DESIGN',
    PROPERTY_INVESTMENT: 'PROPERTY_INVESTMENT',
    AGENTS_PROFESSIONALS: 'AGENTS_PROFESSIONALS',
    STUDENT_HOUSING: 'STUDENT_HOUSING',
    HOME_SERVICES: 'HOME_SERVICES',
    GENERAL: 'GENERAL'
} as const
export type CommunityCategory = (typeof CommunityCategory)[keyof typeof CommunityCategory]

export const JoinRequestStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED'
} as const
export type JoinRequestStatus = (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus]