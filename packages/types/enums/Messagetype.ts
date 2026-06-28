export const MessageType = {
    TEXT: 'TEXT',
    AUDIO: 'AUDIO',
    VIDEO: 'VIDEO',
    FILE: 'FILE'
} as const
export type MessageType = (typeof MessageType)[keyof typeof MessageType]
