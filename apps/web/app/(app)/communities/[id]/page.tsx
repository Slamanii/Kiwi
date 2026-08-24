'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCommunityMessages } from '@/hooks/useMessages'
import { useAuth } from '@/context/AuthContext'
import { communityApi } from '@/lib/api/community'
import ConversationView from '@/components/chat/ConversationView'
import CommunityControlPanel from '@/components/community/CommunityControlPanel'
import { PollComposerModal } from '@/components/community/PollComposerModal'
import type { AttachmentType } from '@/components/chat/MessageInput'
import type { Community } from '@/types'

export default function CommunityPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()
    const { messages, loading, loadingMore, hasMore, loadMore, sendMessage } = useCommunityMessages(id)
    const [community, setCommunity] = useState<Community | null>(null)
    const [showInfo, setShowInfo] = useState(false)
    const [joining, setJoining] = useState(false)
    const [requested, setRequested] = useState(false)
    const [showPollComposer, setShowPollComposer] = useState(false)

    useEffect(() => {
        communityApi.getById(id).then(res => setCommunity(res.data)).catch(console.error)
    }, [id])

    if (!user || !community) {
        return (
            <div className="h-full flex items-center justify-center bg-black text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    const canSend =
        community.currentUserRole === 'ADMIN' ||
        community.messagingMode === 'ALL_MEMBERS' ||
        (community.messagingMode === 'SELECTED_MEMBERS' && !!community.currentUserCanPost)

    function handleAttach(type: AttachmentType) {
        if (type === 'poll') setShowPollComposer(true)
    }

    async function handleJoin() {
        if (joining) return
        setJoining(true)
        try {
            const res = await communityApi.join(id)
            if (res.data.status === 'JOINED') {
                setCommunity(prev => prev ? { ...prev, isMember: true, currentUserRole: 'MEMBER' } : prev)
            } else {
                setRequested(true)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setJoining(false)
        }
    }

    return (
        <>
        <ConversationView
            messages={messages}
            currentUserId={user.id}
            onSend={sendMessage}
            onAttach={handleAttach}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            disabled={!community.isMember || !canSend}
            canModerate={community.currentUserRole === 'ADMIN'}
            context={{ kind: 'community', id }}
            header={{
                peerId: id,
                name: community.name,
                avatarUrl: community.avatarUrl,
                subtitle: `${community.memberCount} ${community.memberCount === 1 ? 'member' : 'members'}`,
                onBack: () => router.push('/communities'),
                onInfo: () => setShowInfo(true),
            }}
            infoPanel={showInfo && (
                <CommunityControlPanel
                    community={community}
                    currentUserId={user.id}
                    onClose={() => setShowInfo(false)}
                    onLeft={() => setCommunity(prev => prev ? { ...prev, isMember: false, currentUserRole: undefined } : prev)}
                    onAvatarUpdated={avatarUrl => setCommunity(prev => prev ? { ...prev, avatarUrl } : prev)}
                />
            )}
            banner={
                !community.isMember ? (
                    requested ? (
                        <div className="px-4 py-2 bg-blue-500/10 text-blue-400 text-xs text-center">
                            Join request sent — waiting for admin approval.
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-blue-500/10 flex items-center justify-between gap-3">
                            <span className="text-white/70 text-xs">
                                {community.requireApproval ? 'Request to join this community to send messages.' : 'Join this community to send messages.'}
                            </span>
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="text-xs font-semibold text-blue-400 shrink-0 cursor-pointer disabled:opacity-40"
                            >
                                {joining ? (community.requireApproval ? 'Requesting…' : 'Joining…') : (community.requireApproval ? 'Request' : 'Join')}
                            </button>
                        </div>
                    )
                ) : !canSend ? (
                    <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs text-center">
                        Only admins can post in this community.
                    </div>
                ) : null
            }
        />
        {showPollComposer && (
            <PollComposerModal
                communityId={id}
                onCreated={() => {}}
                onClose={() => setShowPollComposer(false)}
            />
        )}
        </>
    )
}
