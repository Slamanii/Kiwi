import api from './index'

export const bidApi = {
    create: (seekId: string, data: { amount: number; rate: number; currency?: string; note?: string; images?: string[]; videoUrl?: string }) =>
        api.post(`/bids`, {
            seekId,
            amount: data.amount,
            rate: data.rate,
            currency: data.currency,
            message: data.note,
            images: data.images,
            videoUrl: data.videoUrl,
        }),
    getBySeek: (seekId: string) =>
        api.get(`/bids/seek/${seekId}`),
    getMyBids: () =>
        api.get('/bids/mine'),
    getReceivedBids: () =>
        api.get('/bids/received'),
    getById: (id: string) =>
        api.get(`/bids/${id}`),
    select: (id: string) =>
        api.post(`/bids/${id}/select`),
    withdraw: (id: string) =>
        api.patch(`/bids/${id}/withdraw`),
    reject: (id: string) =>
        api.patch(`/bids/${id}/status`, { status: 'REJECTED' }),
}