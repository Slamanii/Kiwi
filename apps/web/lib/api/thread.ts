import api from './index'

export const threadApi = {
    getMyThreads:      () =>
        api.get('/threads'),

    getById:           (id: string) =>
        api.get(`/threads/${id}`),

    acceptTerms:       (id: string) =>
        api.post(`/threads/${id}/accept`),

    closeThread:       (id: string) =>
        api.delete(`/threads/${id}`),

    updateStatus:      (id: string, status: string) =>
        api.patch(`/threads/${id}/status`, { status }),

    proposeFee:        (threadId: string, agentFee: number) =>
        api.post(`/threads/${threadId}/agreement/propose`, { agentFee }),

    acceptFee:         (threadId: string) =>
        api.post(`/threads/${threadId}/agreement/accept`),

    endNegotiation:    (threadId: string) =>
        api.post(`/threads/${threadId}/agreement/end`),

    getAgreement:      (threadId: string) =>
        api.get(`/threads/${threadId}/agreement`),

    answerAgreementItem: (itemId: string, sentiment: 'GOOD' | 'BAD', answer?: string) =>
        api.patch(`/threads/agreement/items/${itemId}`, { sentiment, answer }),

    signAgreement:     (agreementId: string) =>
        api.post(`/threads/agreement/${agreementId}/sign`),

    completeAgreement: (agreementId: string, rating: { score: number; comment?: string }) =>
        api.post(`/threads/agreement/${agreementId}/complete`, rating),

    disputeAgreement:  (agreementId: string, reason?: string) =>
        api.post(`/threads/agreement/${agreementId}/dispute`, { reason }),

    endThread:         (id: string, reason?: string, rating?: { score: number; comment?: string }) =>
        api.post(`/threads/${id}/end`, { reason, rating }),

    getAssessment:     (id: string) =>
        api.get(`/threads/${id}/assessment`),

    submitAssessment:  (id: string, data: {
        mood: 'GOOD' | 'OKAY' | 'BAD'
        milestones: string[]
        healthTags: string[]
        comment?: string
    }) => api.post(`/threads/${id}/assessment`, data),
}