import api from './index'

export const orderApi = {
    create: (communityId: string, items: { listingId: string; quantity: number }[], description?: string) =>
        api.post(`/orders/${communityId}`, { items, description }),
    getCommunityOrders: (communityId: string, cursor?: string) =>
        api.get(`/orders/community/${communityId}`, { params: { cursor } }),
    cancel: (id: string) =>
        api.delete(`/orders/${id}`),
    followUp: (id: string, content: string) =>
        api.post(`/orders/${id}/follow-up`, { content }),
    complete: (id: string) =>
        api.patch(`/orders/${id}/complete`),
    fulfillByListing: (listingId: string) =>
        api.patch(`/orders/listing/${listingId}/fulfilled`),
    review: (id: string, score: number, comment?: string) =>
        api.post(`/orders/${id}/review`, { score, comment }),
    dispute: (id: string) =>
        api.post(`/orders/${id}/dispute`),
    getMyConversations: () =>
        api.get('/orders/conversations'),
    getCommunityConversations: (communityId: string) =>
        api.get(`/orders/conversations/community/${communityId}`),
    getConversationMessages: (conversationId: string, cursor?: string) =>
        api.get(`/orders/conversation/${conversationId}`, { params: { cursor } }),
    sendConversationMessage: (conversationId: string, content: string, replyToId?: string) =>
        api.post(`/orders/conversation/${conversationId}`, { content, replyToId }),
}
