import api from './index'

export const messageApi = {
    sendToThread: (threadId: string, data: Record<string, any>) =>
        api.post(`/messages/thread/${threadId}`, data),
    sendDM: (userId: string, data: Record<string, any>) =>
        api.post('/messages/dm', { receiverId: userId, ...data }),
    sendCommunityMessage: (communityId: string, data: Record<string, any>) =>
        api.post(`/messages/community/${communityId}`, data),
    markRead: (threadId: string) =>
        api.patch(`/messages/thread/${threadId}/read`),
    markDMRead: (conversationId: string) =>
        api.patch(`/messages/dm/${conversationId}/read`),
    getUnreadCount: () =>
        api.get('/messages/unread'),
    getThreadMessages: (threadId: string, cursor?: string) =>
        api.get(`/messages/thread/${threadId}${cursor ? `?cursor=${cursor}` : ''}`),
    getDMConversations: () =>
        api.get('/messages/dm'),
    getDMMessages:        (userId: string, cursor?: string) =>
        api.get(`/messages/dm/${userId}${cursor ? `?cursor=${cursor}` : ''}`),
    getCommunityMessages: (communityId: string, cursor?: string) =>
        api.get(`/messages/community/${communityId}${cursor ? `?cursor=${cursor}` : ''}`),
}

