import api from './index'

export const seekApi = {
    getFeed: (params?: Record<string, any>) =>
        api.get('/seeks', { params }),
    getById: (id: string) =>
        api.get(`/seeks/${id}`),
    create: (data: Record<string, any>) =>
        api.post('/seeks', data),
    delete: (id: string) =>
        api.delete(`/seeks/${id}`),
    like: (id: string) =>
        api.post(`/seeks/${id}/like`),
    bookmark: (id: string) =>
        api.post(`/seeks/${id}/bookmark`),
    getBookmarks: () =>
        api.get('/seeks/bookmarks'),
    getLiked: () =>
        api.get('/seeks/liked'),
    reseek: (id: string, content: string) =>
        api.post(`/seeks/${id}/reseek`, { content }),
    addComment: (id: string, content: string, parentId?: string) =>
        api.post(`/seeks/${id}/comments`, { content, parentId }),
    getComments: (id: string) =>
        api.get(`/seeks/${id}/comments`),
    deleteComment: (seekId: string, commentId: string) =>
        api.delete(`/seeks/${seekId}/comments/${commentId}`),
    likeComment: (commentId: string) =>
        api.post(`/seeks/comments/${commentId}/like`),
    toggleComments: (id: string) =>
        api.patch(`/seeks/${id}/comments/toggle`),
}