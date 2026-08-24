import api from './index'

export const adminApi = {
    getStats: () =>
        api.get('/admin/stats'),

    getApplications: (params?: { status?: string; cursor?: string; limit?: number }) =>
        api.get('/admin/applications', { params }),
    approveApplication: (id: string) =>
        api.patch(`/admin/applications/${id}/approve`),
    rejectApplication: (id: string, reason?: string) =>
        api.patch(`/admin/applications/${id}/reject`, { reason }),

    getVerifications: (params?: { status?: string; cursor?: string; limit?: number }) =>
        api.get('/admin/verifications', { params }),
    approveVerification: (id: string) =>
        api.patch(`/admin/verifications/${id}/approve`),
    rejectVerification: (id: string, reason?: string) =>
        api.patch(`/admin/verifications/${id}/reject`, { reason }),

    searchUsers: (query: string, limit?: number) =>
        api.get('/admin/users/search', { params: { query, limit } }),
    promoteUser: (id: string) =>
        api.patch(`/admin/users/${id}/promote`),
    banUser: (id: string) =>
        api.patch(`/admin/users/${id}/ban`),
}
