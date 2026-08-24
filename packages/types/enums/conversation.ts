export const ConversationType = {
    THREAD: 'THREAD',
    DM: 'DM',
    COMMUNITY: 'COMMUNITY',
    ORDER: 'ORDER'
} as const
export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType]
