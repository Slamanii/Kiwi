import api from './index'

export const profileApi = {
    getMe: () =>
        api.get('/profile/me'),
    getById: (id: string) =>
        api.get(`/profile/${id}`),
    update: (data: Record<string, any>) =>
        api.patch('/profile', data),
    updateBankDetails: (data: Record<string, any>) =>
        api.patch('/profile/bank', data),
    submitVerification: (data: { nin: string; idType: string; idNumber: string; idDocumentUrl: string; selfieUrl: string }) =>
        api.post('/profile/verify', data),
    searchUsers: (q: string) =>
        api.get('/profile/search', { params: { q } }),
    getAgents: (params?: Record<string, any>) =>
        api.get('/agents', { params }),
    getRatings: (id: string) =>
        api.get(`/profile/${id}/ratings`),
    getReviews: (id: string, cursor?: string) =>
        api.get(`/profile/${id}/reviews`, { params: { cursor } }),
    submitRating: (agentId: string, data: { threadId: string; score: number; comment?: string }) =>
        api.post(`/profile/${agentId}/rate`, data),
    getCatalog: (userId: string) =>
        api.get(`/profile/${userId}/catalog`),
    getCatalogItem: (itemId: string) =>
        api.get(`/profile/catalog/${itemId}`),
    addCatalogItem: (data: { url: string; type: 'IMAGE' | 'VIDEO'; caption?: string }) =>
        api.post('/profile/catalog', data),
    updateCatalogItem: (itemId: string, caption?: string) =>
        api.patch(`/profile/catalog/${itemId}`, { caption }),
    deleteCatalogItem: (itemId: string) =>
        api.delete(`/profile/catalog/${itemId}`),
}