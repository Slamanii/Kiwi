import api from './index'

export const referralApi = {
    getStats: () =>
        api.get('/referrals/stats'),
    getMyReferrals: (cursor?: string) =>
        api.get('/referrals', { params: { cursor } }),
}
