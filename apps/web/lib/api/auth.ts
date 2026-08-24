import api from './index'

export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password}),
    register: (data: { name: string; email: string; password: string; phone?: string }) => 
        api.post('/auth/register', data),
    refreshToken: (refreshToken: string) => 
        api.post('auth/refresh', { refreshToken }),
    changePassword: (data: { currentPassword: string; newPassword: string }) => 
        api.post('/auth/change-password', data),
    requestPasswordReset: (email: string) =>
        api.post('/auth/request-reset', { email}),
    resetPassword: (email: string, resetToken: string, newPassword: string) =>
        api.post('/auth/reset-password', { email, resetToken, newPassword }),
    requestEmailUpdate: (email: string) => 
        api.post('/auth/update-email', { email }),
    registerDeviceToken: (token: string) =>
        api.post('/device/register', { token }),
    becomeAgent: (data: {
        zone: string
        rate: number
        policyNote: string
        nin: string
        idNumber: string
        idType: string
        idDocumentUrl: string
        bio?: string
        phone?: string
        accountNumber: string
        bankCode: string
        accountName: string
        agentReferralCode?: string
    }) =>
        api.post('/auth/become-agent', data),

}