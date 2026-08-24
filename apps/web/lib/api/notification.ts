import api from './index'

export const notificationApi = {
    getAll: (cursor?: string) =>
        api.get('/notifications', { params: { cursor } }),
    markRead: (id: string) =>
        api.patch(`/notifications/${id}/read`),
    markAllRead: () =>
        api.patch('/notifications/read-all'),
}