'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useThread } from '@/hooks/useThread'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/context/AuthContext'
import { threadApi } from '@/lib/api/thread'
import ConversationView from '@/components/chat/ConversationView'
import ControlPanel from '@/components/chat/ControlPanel'
import { AgreementChecklistSheet } from '@/components/agreement/AgreementChecklistSheet'
import { FeeNegotiationModal } from '@/components/agreement/FeeNegotiationModal'
import type { AttachmentType } from '@/components/chat/MessageInput'
import type { Agreement } from '@/types'

export default function ThreadPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()
    const { thread, loading: threadLoading, setThread } = useThread(id)
    const { messages, loading, loadingMore, hasMore, loadMore, sendMessage } = useMessages(id)
    const [accepting, setAccepting] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const [showAgreement, setShowAgreement] = useState(false)

    if (!user || threadLoading || !thread) {
        return (
            <div className="h-full flex items-center justify-center bg-black text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    const isClient = thread.clientId === user.id
    const other = isClient ? thread.agent : thread.client
    const myAccepted = isClient ? thread.clientAccepted : thread.agentAccepted
    const isClosed = thread.status === 'CLOSED'

    async function handleAcceptTerms() {
        setAccepting(true)
        try {
            await threadApi.acceptTerms(id)
            setThread(prev => prev ? { ...prev, [isClient ? 'clientAccepted' : 'agentAccepted']: true } : prev)
        } catch (err) {
            console.error(err)
        } finally {
            setAccepting(false)
        }
    }

    function handleAttach(type: AttachmentType) {
        if (type === 'form') setShowAgreement(true)
    }

    function handleAgreementChange(agreement: Agreement) {
        setThread(prev => prev ? { ...prev, agreement } : prev)
    }

    function handleNegotiationEnded() {
        setThread(prev => prev ? { ...prev, status: 'CLOSED', agreement: null } : prev)
    }

    return (
        <>
            <ConversationView
                messages={messages}
                currentUserId={user.id}
                onSend={sendMessage}
                loading={loading}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
                disabled={isClosed || !myAccepted}
                showAgreementOption
                onAttach={handleAttach}
                context={{ kind: 'thread', id }}
                header={{
                    peerId: other.id,
                    name: other.name,
                    avatarUrl: other.profile?.avatarUrl,
                    subtitle: isClosed ? 'Thread closed' : thread.agreement?.status ?? 'Active',
                    onBack: () => router.push('/chat'),
                    onInfo: () => setShowInfo(true),
                }}
                infoPanel={showInfo && (
                    <ControlPanel
                        type="THREAD"
                        conversationId={id}
                        name={other.name}
                        avatarUrl={other.profile?.avatarUrl}
                        onClose={() => setShowInfo(false)}
                    />
                )}
                banner={
                    isClosed ? (
                        <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs text-center">
                            This thread has been closed.
                        </div>
                    ) : !myAccepted ? (
                        <div className="px-4 py-2 bg-blue-500/10 flex items-center justify-between gap-3">
                            <span className="text-white/70 text-xs">Accept the platform terms to continue this deal.</span>
                            <button
                                onClick={handleAcceptTerms}
                                disabled={accepting}
                                className="text-xs font-semibold text-blue-400 shrink-0 cursor-pointer disabled:opacity-40"
                            >
                                Accept
                            </button>
                        </div>
                    ) : null
                }
            />
            {thread.agreement?.status === 'PENDING' && (
                <FeeNegotiationModal
                    threadId={id}
                    agreement={thread.agreement}
                    currentUserId={user.id}
                    isClient={isClient}
                    onAgreementChange={handleAgreementChange}
                    onEnded={handleNegotiationEnded}
                />
            )}
            {showAgreement && (
                <AgreementChecklistSheet
                    threadId={id}
                    threadCreatedAt={thread.createdAt}
                    currentUserId={user.id}
                    isClient={isClient}
                    onClose={() => setShowAgreement(false)}
                />
            )}
        </>
    )
}
