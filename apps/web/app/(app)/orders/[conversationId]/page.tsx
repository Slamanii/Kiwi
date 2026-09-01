'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useOrderConversation } from '@/hooks/useOrderConversation'
import ConversationView from '@/components/chat/ConversationView'
import ControlPanel from '@/components/chat/ControlPanel'

export default function OrderConversationPage() {
    const { conversationId } = useParams<{ conversationId: string }>()
    const router = useRouter()
    const { user } = useAuth()
    const {
        conversation, messages, loading, loadingMore, hasMore, loadMore, sendMessage,
    } = useOrderConversation(conversationId)
    const [showInfo, setShowInfo] = useState(false)

    if (!user) {
        return (
            <div className="h-full flex items-center justify-center bg-black text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    const isBuyer = conversation?.buyerId === user.id
    const name = isBuyer ? (conversation?.community?.name ?? 'Store') : (conversation?.buyer?.name ?? 'Buyer')
    const avatarUrl = isBuyer ? conversation?.community?.avatarUrl : conversation?.buyer?.profile?.avatarUrl
    const verified = !isBuyer && conversation?.buyer?.profile?.verificationStatus === 'VERIFIED'

    return (
        <ConversationView
            messages={messages}
            currentUserId={user.id}
            header={{
                peerId: conversationId,
                name,
                avatarUrl,
                verified,
                subtitle: isBuyer ? 'Store' : undefined,
                onBack: () => router.back(),
                onInfo: () => setShowInfo(true),
            }}
            context={{ kind: 'order', id: conversationId }}
            canModerate={!isBuyer}
            infoPanel={showInfo && conversation && (
                <ControlPanel
                    type="ORDER"
                    conversationId={conversation.id}
                    name={name}
                    avatarUrl={avatarUrl}
                    verified={verified}
                    subtitle={isBuyer ? 'Store' : undefined}
                    otherUserId={isBuyer ? undefined : conversation.buyerId}
                    onClose={() => setShowInfo(false)}
                    onBlocked={() => router.back()}
                />
            )}
            onSend={sendMessage}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
        />
    )
}
