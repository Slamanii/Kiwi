import api from './index'

export type ConversationType = 'THREAD' | 'DM' | 'COMMUNITY' | 'ORDER'

export const conversationApi = {
    blockUser: (userId: string) =>
        api.post(`/users/${userId}/block`),
    unblockUser: (userId: string) =>
        api.delete(`/users/${userId}/block`),
    getBlockedUsers: () =>
        api.get('/users/blocked'),
    getPreferences: () =>
        api.get('/conversations/preferences'),
    setMuted: (type: ConversationType, id: string, value: boolean) =>
        api.patch(`/conversations/${type.toLowerCase()}/${id}/mute`, { value }),
    setPinned: (type: ConversationType, id: string, value: boolean) =>
        api.patch(`/conversations/${type.toLowerCase()}/${id}/pin`, { value }),
    setArchived: (type: ConversationType, id: string, value: boolean) =>
        api.patch(`/conversations/${type.toLowerCase()}/${id}/archive`, { value }),
    getMedia: (type: ConversationType, id: string, cursor?: string) =>
        api.get(`/conversations/${type.toLowerCase()}/${id}/media`, { params: { cursor } }),
    search: (type: ConversationType, id: string, q: string, cursor?: string) =>
        api.get(`/conversations/${type.toLowerCase()}/${id}/search`, { params: { q, cursor } }),
    deleteMessage: (type: ConversationType, id: string, messageId: string) =>
        api.delete(`/conversations/${type.toLowerCase()}/${id}/messages/${messageId}`),
    deleteMessages: (type: ConversationType, id: string, messageIds: string[]) =>
        api.delete(`/conversations/${type.toLowerCase()}/${id}/messages`, { data: { messageIds } }),
    setMessagePinned: (type: ConversationType, id: string, messageId: string, value: boolean) =>
        api.patch(`/conversations/${type.toLowerCase()}/${id}/messages/${messageId}/pin`, { value }),
    setMessageArchived: (type: ConversationType, id: string, messageId: string, value: boolean) =>
        api.patch(`/conversations/${type.toLowerCase()}/${id}/messages/${messageId}/archive`, { value }),
    getPinnedMessage: (type: ConversationType, id: string) =>
        api.get(`/conversations/${type.toLowerCase()}/${id}/pinned-message`),
    clearConversation: (type: ConversationType, id: string) =>
        api.delete(`/conversations/${type.toLowerCase()}/${id}`),
}
