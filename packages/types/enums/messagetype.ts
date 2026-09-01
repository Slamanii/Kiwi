export const MessageType = {
    TEXT: 'TEXT',
    AUDIO: 'AUDIO',
    VIDEO: 'VIDEO',
    FILE: 'FILE',
    POLL: 'POLL',
    IMAGE: 'IMAGE',
    STICKER: 'STICKER'
} as const
export type MessageType = (typeof MessageType)[keyof typeof MessageType]
