import api from './index'

export const pollApi = {
    create: (communityId: string, data: { question: string; options: string[]; allowMultiple?: boolean; closesAt?: string }) =>
        api.post(`/polls/${communityId}`, data),
    vote: (pollId: string, optionIds: string[]) =>
        api.post(`/polls/${pollId}/vote`, { optionIds }),
    getResults: (pollId: string) =>
        api.get(`/polls/${pollId}`),
    delete: (pollId: string) =>
        api.delete(`/polls/${pollId}`),
}
