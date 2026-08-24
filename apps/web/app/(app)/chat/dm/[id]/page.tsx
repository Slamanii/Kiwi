'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDMMessages } from '@/hooks/useMessages'
import { useAuth } from '@/context/AuthContext'
import { profileApi } from '@/lib/api/profile'
import ConversationView from '@/components/chat/ConversationView'
import ControlPanel from '@/components/chat/ControlPanel'
import type { User, Profile } from '@/types'

export default function DMPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()
    const { messages, loading, loadingMore, hasMore, loadMore, sendMessage, conversationId } = useDMMessages(id)
    const [other, setOther] = useState<(User & { profile?: Profile }) | null>(null)
    const [showInfo, setShowInfo] = useState(false)

    useEffect(() => {
        profileApi.getById(id).then(res => setOther(res.data)).catch(console.error)
    }, [id])

    if (!user || !other) {
        return (
            <div className="h-full flex items-center justify-center bg-black text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    return (
        <ConversationView
            messages={messages}
            currentUserId={user.id}
            onSend={sendMessage}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            context={conversationId ? { kind: 'dm', id: conversationId } : undefined}
            header={{
                peerId: other.id,
                name: other.name,
                avatarUrl: other.profile?.avatarUrl,
                onBack: () => router.push('/chat'),
                onInfo: () => setShowInfo(true),
            }}
            infoPanel={showInfo && conversationId && (
                <ControlPanel
                    type="DM"
                    conversationId={conversationId}
                    name={other.name}
                    avatarUrl={other.profile?.avatarUrl}
                    otherUserId={other.id}
                    onClose={() => setShowInfo(false)}
                    onCleared={() => window.location.reload()}
                    onBlocked={() => router.push('/chat')}
                />
            )}
        />
    )
}
