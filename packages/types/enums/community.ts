export const CommunityRole = {
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER'
} as const
export type CommunityRole =  (typeof CommunityRole)[keyof typeof CommunityRole]