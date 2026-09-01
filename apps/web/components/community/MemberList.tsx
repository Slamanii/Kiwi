'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { communityApi } from '@/lib/api/community'
import type { CommunityMember, CommunityMessagingMode } from '@/types'

type MemberListProps = {
    communityId: string
    isAdmin: boolean
    currentUserId: string
    messagingMode?: CommunityMessagingMode
}

export function MemberList({ communityId, isAdmin, currentUserId, messagingMode }: MemberListProps) {
    const [members, setMembers] = useState<CommunityMember[]>([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<string | null>(null)

    useEffect(() => {
        communityApi.getMembers(communityId)
            .then(res => setMembers(res.data.members))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [communityId])

    async function handlePromote(userId: string) {
        if (busyId) return
        setBusyId(userId)
        try {
            await communityApi.promoteMember(communityId, userId)
            setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: 'ADMIN' } : m))
        } catch (err) {
            console.error(err)
        } finally {
            setBusyId(null)
        }
    }

    async function handleToggleCanPost(userId: string) {
        if (busyId) return
        setBusyId(userId)
        try {
            await communityApi.toggleMemberCanPost(communityId, userId)
            setMembers(prev => prev.map(m => m.userId === userId ? { ...m, canPost: !m.canPost } : m))
        } catch (err) {
            console.error(err)
        } finally {
            setBusyId(null)
        }
    }

    if (loading) {
        return <p className="text-white/30 text-sm text-center py-6">Loading…</p>
    }
    if (members.length === 0) {
        return <p className="text-white/30 text-sm text-center py-6">No members yet.</p>
    }

    return (
        <div className="space-y-1">
            {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                    <Avatar src={m.user.profile?.avatarUrl} name={m.user.name} size="md" />
                    <div className="flex-1 min-w-0">
                        <p className="flex items-center gap-1.5 text-white text-sm font-medium truncate">
                            {m.user.name}{m.userId === currentUserId ? ' (You)' : ''}
                            {m.user.profile?.verificationStatus === 'VERIFIED' && (
                                <VerifiedBadge size="xs" />
                            )}
                        </p>
                        {m.role === 'ADMIN' && (
                            <p className="text-cyan-400 text-[11px] font-medium">Admin</p>
                        )}
                    </div>
                    {isAdmin && m.role !== 'ADMIN' && (
                        <button
                            onClick={() => handlePromote(m.userId)}
                            disabled={busyId === m.userId}
                            className="text-[11px] font-semibold text-white/50 px-2.5 py-1 rounded-full border border-white/10 disabled:opacity-40"
                        >
                            Make Admin
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}
