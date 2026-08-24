import api from './index'
import type { Community } from '@/types'

type CommunityCategory =
    | 'NEIGHBORHOOD' | 'REAL_ESTATE' | 'INTERIOR_DESIGN' | 'PROPERTY_INVESTMENT'
    | 'AGENTS_PROFESSIONALS' | 'STUDENT_HOUSING' | 'HOME_SERVICES' | 'GENERAL'

export const communityApi = {
    getAll: (cursor?: string, type?: 'STANDARD' | 'MARKETPLACE', category?: CommunityCategory) =>
        api.get('/communities', { params: { cursor, type, category } }),
    search: (q: string, cursor?: string, type?: 'STANDARD' | 'MARKETPLACE', category?: CommunityCategory) =>
        api.get('/communities/search', { params: { q, cursor, type, category } }),
    getMy: (cursor?: string) =>
        api.get('/communities/my', { params: { cursor } }),
    create: (data: {
        name: string
        description?: string
        avatarUrl?: string
        isPrivate?: boolean
        type?: 'STANDARD' | 'MARKETPLACE'
        category?: CommunityCategory
        requireApproval?: boolean
    }) => api.post<Community>('/communities', data),
    getById: (id: string) =>
        api.get(`/communities/${id}`),
    join: (id: string) =>
        api.post(`/communities/${id}/join`),
    leave: (id: string) =>
        api.delete(`/communities/${id}/leave`),
    getMembers: (id: string, cursor?: string) =>
        api.get(`/communities/${id}/members`, { params: { cursor } }),
    promoteMember: (id: string, memberId: string) =>
        api.patch(`/communities/${id}/members/${memberId}/promote`),
    getJoinRequests: (id: string) =>
        api.get(`/communities/${id}/requests`),
    acceptJoinRequest: (id: string, requestId: string) =>
        api.post(`/communities/${id}/requests/${requestId}/accept`),
    declineJoinRequest: (id: string, requestId: string) =>
        api.post(`/communities/${id}/requests/${requestId}/decline`),
    setRequireApproval: (id: string, value: boolean) =>
        api.patch(`/communities/${id}/require-approval`, { value }),
    setAvatar: (id: string, avatarUrl: string) =>
        api.patch(`/communities/${id}/avatar`, { avatarUrl }),
    setMessagingMode: (id: string, mode: 'ADMIN_ONLY' | 'ALL_MEMBERS' | 'SELECTED_MEMBERS') =>
        api.patch(`/communities/${id}/mode`, { mode }),
    toggleMemberCanPost: (id: string, memberId: string) =>
        api.patch(`/communities/${id}/members/${memberId}/canPost`),
}
