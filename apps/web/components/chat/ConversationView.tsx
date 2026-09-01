'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import MessageBubble from './MessageBubble'
import MediaMessageBubble from './MediaMessageBubble'
import TypingBubble from './TypingBubble'
import MessageInput, { AttachmentType } from './MessageInput'
import PollMessageBubble from '@/components/community/PollMessageBubble'
import ListingMessageBubble from '@/components/community/ListingMessageBubble'
import { OrderCard } from '@/components/community/OrderCard'
import { OrderReviewSheet } from '@/components/community/OrderReviewSheet'
import ParticipantHeader from './ParticipantHeader'
import { ActionSheetItem } from './ActionSheet'
import MessageActionMenu from './MessageActionMenu'
import AudioRecorderSheet from './AudioRecorderSheet'
import StickerPickerSheet from './StickerPickerSheet'
import { MediaViewport } from '@/components/ui/MediaViewport'
import { useCall } from '@/context/CallContext'
import { usePresence, formatLastSeen } from '@/hooks/usePresence'
import { useTypingEmitter, usePeerTyping } from '@/hooks/useTyping'
import { useLongPress } from '@/hooks/useLongPress'
import { useSwipeToReply } from '@/hooks/useSwipeToReply'
import { useSocket } from '@/context/SocketContext'
import { conversationApi, type ConversationType } from '@/lib/api/conversation'
import { pollApi } from '@/lib/api/poll'
import { orderApi } from '@/lib/api/order'
import { uploadApi } from '@/lib/api/upload'
import { CopyIcon, PinIcon, ArchiveIcon, TrashIcon, ReplyIcon, SelectIcon } from '@/components/ui/Icons'
import type { Message, Order, MediaItem } from '@/types'
import type { SendMessageInput } from '@kiwi/types'

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(iso: string) {
    const date = new Date(iso)
    const now = new Date()
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' })
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function isSameDay(a: string, b: string) {
    const da = new Date(a)
    const db = new Date(b)
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function contextType(kind: 'thread' | 'dm' | 'community' | 'order'): ConversationType {
    return kind.toUpperCase() as ConversationType
}

type ConversationViewProps = {
    messages: Message[]
    currentUserId: string
    onSend: (input: SendMessageInput) => void
    onAttach?: (type: AttachmentType) => void
    loading?: boolean
    hasMore?: boolean
    loadingMore?: boolean
    onLoadMore?: () => void
    disabled?: boolean
    showAgreementOption?: boolean
    canModerate?: boolean
    header: {
        peerId: string
        name: string
        avatarUrl?: string | null
        subtitle?: string
        verified?: boolean
        onBack: () => void
        onInfo?: () => void
    }
    context?: { kind: 'thread' | 'dm' | 'community' | 'order'; id: string }
    banner?: React.ReactNode
    infoPanel?: React.ReactNode
}

export default function ConversationView({
    messages,
    currentUserId,
    onSend,
    onAttach,
    loading,
    hasMore,
    loadingMore,
    onLoadMore,
    disabled,
    showAgreementOption,
    canModerate,
    header,
    context,
    banner,
    infoPanel,
}: ConversationViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const router = useRouter()
    const socket = useSocket()
    const { startCall } = useCall()
    const isCommunity = context?.kind === 'community'
    const isOrder = context?.kind === 'order'
    // Presence/typing/calls are all 1:1 concepts — meaningless once header.peerId
    // is a community id rather than a real user, so skip them in that context.
    const { online, lastSeenAt } = usePresence((isCommunity || isOrder) ? undefined : header.peerId)
    const { notifyTyping, notifyStopped } = useTypingEmitter(currentUserId, header.peerId, context)
    const peerTyping = usePeerTyping((isCommunity || isOrder) ? undefined : header.peerId)

    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [replyTarget, setReplyTarget] = useState<Message | null>(null)
    const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null)
    const [actionMessage, setActionMessage] = useState<Message | null>(null)
    const [actionAnchor, setActionAnchor] = useState<{ top: number; bottom: number; left: number; right: number } | null>(null)
    const [completingOrderId, setCompletingOrderId] = useState<string | null>(null)
    const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
    const [dismissedReviewOrderIds, setDismissedReviewOrderIds] = useState<Set<string>>(new Set())
    const [showAudioRecorder, setShowAudioRecorder] = useState(false)
    const [showStickerPicker, setShowStickerPicker] = useState(false)
    const [viewerItems, setViewerItems] = useState<{ items: MediaItem[]; index: number } | null>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const headerSubtitle = (isCommunity || isOrder)
        ? header.subtitle
        : peerTyping ? 'typing…' : header.subtitle ?? (online ? 'Online' : formatLastSeen(lastSeenAt))

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' })
    }, [messages.length, peerTyping])

    useEffect(() => {
        if (!context) { setPinnedMessage(null); return }
        conversationApi.getPinnedMessage(contextType(context.kind), context.id)
            .then(res => setPinnedMessage(res.data ?? null))
            .catch(() => setPinnedMessage(null))
    }, [context?.kind, context?.id])

    useEffect(() => {
        if (!socket || !context) return
        const type = contextType(context.kind)
        const onPinned = (payload: { conversationType: string; conversationId: string; message: Message }) => {
            if (payload.conversationType !== type || payload.conversationId !== context.id) return
            setPinnedMessage(payload.message)
        }
        const onUnpinned = (payload: { conversationType: string; conversationId: string; message: Message }) => {
            if (payload.conversationType !== type || payload.conversationId !== context.id) return
            setPinnedMessage(prev => (prev?.id === payload.message.id ? null : prev))
        }
        socket.on('message:pinned', onPinned)
        socket.on('message:unpinned', onUnpinned)
        return () => {
            socket.off('message:pinned', onPinned)
            socket.off('message:unpinned', onUnpinned)
        }
    }, [socket, context?.kind, context?.id])

    useEffect(() => {
        if (!isOrder) return
        const pending = [...messages].reverse().find(m =>
            m.order &&
            m.order.status === 'COMPLETED' &&
            m.order.buyerId === currentUserId &&
            !m.order.review &&
            !dismissedReviewOrderIds.has(m.order.id)
        )
        if (pending?.order) setReviewOrder(pending.order)
    }, [isOrder, messages, currentUserId, dismissedReviewOrderIds])

    async function handleCompleteOrder(orderId: string) {
        if (completingOrderId) return
        setCompletingOrderId(orderId)
        try {
            await orderApi.complete(orderId)
        } catch (err: any) {
            window.alert(err?.response?.data?.error ?? 'Something went wrong')
        } finally {
            setCompletingOrderId(null)
        }
    }

    function closeReviewSheet() {
        if (reviewOrder) setDismissedReviewOrderIds(prev => new Set(prev).add(reviewOrder.id))
        setReviewOrder(null)
    }

    async function submitReview(score: number, comment?: string) {
        if (!reviewOrder) return
        await orderApi.review(reviewOrder.id, score, comment)
        setDismissedReviewOrderIds(prev => new Set(prev).add(reviewOrder.id))
        setReviewOrder(null)
    }

    function handleScroll() {
        const el = scrollRef.current
        if (!el || !hasMore || loadingMore || !onLoadMore) return
        if (el.scrollTop < 80) onLoadMore()
    }

    function scrollToMessage(id: string) {
        messageRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    function handleSend(content: string) {
        onSend({ content, replyToId: replyTarget?.id })
        setReplyTarget(null)
    }

    function handleAttachType(type: AttachmentType) {
        switch (type) {
            case 'camera': cameraInputRef.current?.click(); break
            case 'gallery': galleryInputRef.current?.click(); break
            case 'video': videoInputRef.current?.click(); break
            case 'file': fileInputRef.current?.click(); break
            case 'audio': setShowAudioRecorder(true); break
            case 'sticker': setShowStickerPicker(true); break
            default: onAttach?.(type)
        }
    }

    async function uploadAndSend(files: FileList | null, mappedType?: 'IMAGE' | 'VIDEO' | 'FILE') {
        if (!files || files.length === 0) return
        for (const file of Array.from(files)) {
            const type = mappedType ?? (file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : 'FILE')
            try {
                const res = await uploadApi.uploadFile(file)
                onSend({
                    type,
                    mediaUrl: res.data.url,
                    mediaSize: res.data.size,
                    fileName: res.data.fileName,
                    replyToId: replyTarget?.id,
                })
            } catch (err) {
                window.alert('Upload failed. Please try again.')
            }
        }
        setReplyTarget(null)
    }

    async function handleSendAudio(blob: Blob, seconds: number) {
        const file = new File([blob], 'voice-note.webm', { type: blob.type || 'audio/webm' })
        try {
            const res = await uploadApi.uploadFile(file)
            onSend({
                type: 'AUDIO',
                mediaUrl: res.data.url,
                mediaSize: res.data.size,
                mediaDuration: seconds,
                fileName: res.data.fileName,
                replyToId: replyTarget?.id,
            })
        } catch (err) {
            window.alert('Upload failed. Please try again.')
        }
        setReplyTarget(null)
    }

    function handleSendSticker(emoji: string) {
        onSend({ type: 'STICKER', content: emoji, replyToId: replyTarget?.id })
        setReplyTarget(null)
    }

    function openMediaViewer(index: number) {
        const items: MediaItem[] = messages
            .filter(m => (m.type === 'IMAGE' || m.type === 'VIDEO') && m.mediaUrl)
            .map(m => ({ type: m.type === 'VIDEO' ? 'video' : 'image', url: m.mediaUrl as string }))
        const target = messages[index]
        const targetIdx = messages
            .filter(m => (m.type === 'IMAGE' || m.type === 'VIDEO') && m.mediaUrl)
            .findIndex(m => m.id === target.id)
        setViewerItems({ items, index: Math.max(0, targetIdx) })
    }

    function toggleSelected(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function exitSelection() {
        setSelectionMode(false)
        setSelectedIds(new Set())
    }

    async function bulkCopy() {
        const text = messages.filter(m => selectedIds.has(m.id) && m.content).map(m => m.content).join('\n')
        if (text) await navigator.clipboard.writeText(text)
        exitSelection()
    }

    async function bulkDelete() {
        if (!context || selectedIds.size === 0) return
        const type = contextType(context.kind)
        const selected = messages.filter(m => selectedIds.has(m.id))
        const pollIds = selected.filter(m => m.type === 'POLL' && m.pollId).map(m => m.pollId as string)
        const plainIds = selected.filter(m => !(m.type === 'POLL' && m.pollId)).map(m => m.id)
        try {
            await Promise.all([
                ...pollIds.map(id => pollApi.delete(id)),
                ...(plainIds.length > 0 ? [conversationApi.deleteMessages(type, context.id, plainIds)] : []),
            ])
        } catch (err) {
            console.error(err)
        } finally {
            exitSelection()
        }
    }

    async function togglePinned(m: Message) {
        if (!context) return
        try {
            await conversationApi.setMessagePinned(contextType(context.kind), context.id, m.id, !m.pinned)
        } catch (err) {
            console.error(err)
        }
    }

    async function toggleArchived(m: Message) {
        if (!context) return
        try {
            await conversationApi.setMessageArchived(contextType(context.kind), context.id, m.id, !m.archived)
        } catch (err) {
            console.error(err)
        }
    }

    async function deleteOne(m: Message) {
        if (!context) return
        try {
            if (m.type === 'POLL' && m.pollId) await pollApi.delete(m.pollId)
            else await conversationApi.deleteMessage(contextType(context.kind), context.id, m.id)
        } catch (err) {
            console.error(err)
        }
    }

    function buildActionItems(m: Message): ActionSheetItem[] {
        const items: ActionSheetItem[] = [
            { key: 'reply', label: 'Reply', icon: <ReplyIcon className="w-4 h-4" />, onSelect: () => setReplyTarget(m) },
        ]
        if (m.content) {
            items.push({ key: 'copy', label: 'Copy', icon: <CopyIcon className="w-4 h-4" />, onSelect: () => { navigator.clipboard.writeText(m.content ?? '') } })
        }
        items.push({
            key: 'pin',
            label: m.pinned ? 'Unpin' : 'Pin',
            icon: <PinIcon className="w-4 h-4" filled={m.pinned} />,
            onSelect: () => togglePinned(m),
        })
        items.push({
            key: 'archive',
            label: m.archived ? 'Unarchive' : 'Archive',
            icon: <ArchiveIcon className="w-4 h-4" filled={m.archived} />,
            onSelect: () => toggleArchived(m),
        })
        items.push({
            key: 'select',
            label: 'Select',
            icon: <SelectIcon className="w-4 h-4" />,
            onSelect: () => { setSelectionMode(true); setSelectedIds(new Set([m.id])) },
        })
        if (m.senderId === currentUserId || canModerate) {
            items.push({
                key: 'delete',
                label: 'Delete',
                icon: <TrashIcon className="w-4 h-4" />,
                destructive: true,
                onSelect: () => deleteOne(m),
            })
        }
        return items
    }

    function closeActionMenu() {
        setActionMessage(null)
        setActionAnchor(null)
    }

    return (
        <div className="h-full flex flex-col bg-black">
            <div className="relative z-10 bg-black">
                <ParticipantHeader
                    name={header.name}
                    avatarUrl={header.avatarUrl}
                    isOnline={online}
                    subtitle={headerSubtitle}
                    verified={header.verified}
                    onBack={header.onBack}
                    onInfo={header.onInfo}
                    onVoiceCall={(isCommunity || isOrder) ? undefined : () => startCall({ id: header.peerId, name: header.name, avatarUrl: header.avatarUrl, verified: header.verified }, 'audio')}
                    onVideoCall={(isCommunity || isOrder) ? undefined : () => startCall({ id: header.peerId, name: header.name, avatarUrl: header.avatarUrl, verified: header.verified }, 'video')}
                />
            </div>

            <div className="chat-bg-pattern flex-1 min-h-0 flex flex-col">
                {banner}

                {pinnedMessage && (
                    <button
                        onClick={() => scrollToMessage(pinnedMessage.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/10 text-left"
                    >
                        <PinIcon className="w-3.5 h-3.5 text-white/40 shrink-0" filled />
                        <div className="min-w-0 flex-1">
                            <p className="text-white/40 text-[10px]">Pinned message</p>
                            <p className="text-white/70 text-xs truncate">
                                {pinnedMessage.deleted ? 'This message was deleted' : pinnedMessage.content ?? 'Attachment'}
                            </p>
                        </div>
                    </button>
                )}

                <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-white/30 text-sm">Loading…</div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-white/30 text-sm">No messages yet — say hello.</div>
                    ) : (
                        <>
                            {loadingMore && (
                                <div className="text-center text-white/30 text-xs py-2">Loading more…</div>
                            )}
                            {messages.map((m, i) => {
                                const isSent = m.senderId === currentUserId
                                return (
                                    <div
                                        key={m.id}
                                        ref={el => {
                                            if (el) messageRefs.current.set(m.id, el)
                                            else messageRefs.current.delete(m.id)
                                        }}
                                    >
                                        {(i === 0 || !isSameDay(messages[i - 1].createdAt, m.createdAt)) && (
                                            <div className="flex items-center justify-center py-3">
                                                <span className="text-white/40 text-[11px] font-medium bg-white/5 rounded-full px-3 py-1">
                                                    {formatDayLabel(m.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                        <MessageRow
                                            isSent={isSent}
                                            selectionMode={selectionMode}
                                            isSelected={selectedIds.has(m.id)}
                                            onToggleSelect={() => toggleSelected(m.id)}
                                            onLongPress={rect => { setActionMessage(m); setActionAnchor(rect) }}
                                            onSwipeReply={() => setReplyTarget(m)}
                                        >
                                            {m.replyTo && (
                                                <div className={`px-4 ${isSent ? 'text-right' : 'text-left'}`}>
                                                    <div className="inline-block max-w-[70%] border-l-2 border-white/20 pl-2 mb-0.5">
                                                        <p className="text-white/30 text-[10px]">{m.replyTo.sender.name}</p>
                                                        <p className="text-white/40 text-[11px] truncate">
                                                            {m.replyTo.deleted ? 'This message was deleted' : m.replyTo.content ?? 'Attachment'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {m.deleted ? (
                                                <MessageBubble
                                                    content="This message was deleted"
                                                    isSent={isSent}
                                                    timestamp={formatTime(m.createdAt)}
                                                    senderName={m.sender?.name}
                                                    senderAvatarUrl={m.sender?.profile?.avatarUrl}
                                                    senderVerified={m.sender?.profile?.verificationStatus === 'VERIFIED'}
                                                />
                                            ) : m.order ? (
                                                <div className="px-4 py-2">
                                                    <p className={`text-white/30 text-[11px] mb-1 ${isSent ? 'text-right' : 'text-left'}`}>
                                                        {m.sender?.name} · {formatTime(m.createdAt)}
                                                    </p>
                                                    <OrderCard
                                                        order={m.order}
                                                        currentUserId={currentUserId}
                                                        readOnly
                                                        isAdmin={canModerate}
                                                        onComplete={() => handleCompleteOrder(m.order!.id)}
                                                        completing={completingOrderId === m.order.id}
                                                    />
                                                </div>
                                            ) : m.type === 'POLL' && m.poll ? (
                                                <PollMessageBubble
                                                    poll={m.poll}
                                                    isSent={isSent}
                                                    timestamp={formatTime(m.createdAt)}
                                                    senderName={m.sender?.name}
                                                    senderAvatarUrl={m.sender?.profile?.avatarUrl}
                                                    senderVerified={m.sender?.profile?.verificationStatus === 'VERIFIED'}
                                                />
                                            ) : m.listing ? (
                                                <ListingMessageBubble
                                                    listing={m.listing}
                                                    isSent={isSent}
                                                    timestamp={formatTime(m.createdAt)}
                                                    senderName={m.sender?.name}
                                                    senderAvatarUrl={m.sender?.profile?.avatarUrl}
                                                    senderVerified={m.sender?.profile?.verificationStatus === 'VERIFIED'}
                                                    onOpen={() => { if (!selectionMode) router.push(`/listings/${m.listing!.id}`) }}
                                                />
                                            ) : m.type === 'STICKER' ? (
                                                <div className={`flex px-4 py-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-6xl leading-none">{m.content}</span>
                                                </div>
                                            ) : (m.type === 'IMAGE' || m.type === 'VIDEO' || m.type === 'AUDIO' || m.type === 'FILE') && m.mediaUrl ? (
                                                <MediaMessageBubble
                                                    message={m}
                                                    isSent={isSent}
                                                    timestamp={formatTime(m.createdAt)}
                                                    senderName={m.sender?.name}
                                                    senderAvatarUrl={m.sender?.profile?.avatarUrl}
                                                    senderVerified={m.sender?.profile?.verificationStatus === 'VERIFIED'}
                                                    onOpenMedia={() => { if (!selectionMode) openMediaViewer(i) }}
                                                />
                                            ) : (
                                                <MessageBubble
                                                    content={m.content ?? ''}
                                                    isSent={isSent}
                                                    timestamp={formatTime(m.createdAt)}
                                                    senderName={m.sender?.name}
                                                    senderAvatarUrl={m.sender?.profile?.avatarUrl}
                                                    senderVerified={m.sender?.profile?.verificationStatus === 'VERIFIED'}
                                                />
                                            )}
                                        </MessageRow>
                                    </div>
                                )
                            })}
                        </>
                    )}
                    {peerTyping && !isCommunity && !isOrder && (
                        <TypingBubble avatarUrl={header.avatarUrl} name={header.name} />
                    )}
                    <div ref={bottomRef} />
                </div>

                {selectionMode ? (
                    <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-[#1c1c1e]/90 backdrop-blur-xl border-t border-white/10">
                        <button onClick={exitSelection} className="text-white/60 text-sm">Cancel</button>
                        <span className="text-white/50 text-xs">{selectedIds.size} selected</span>
                        <div className="flex items-center gap-4">
                            <button onClick={bulkCopy} disabled={selectedIds.size === 0} className="text-white/70 disabled:opacity-30">
                                <CopyIcon className="w-5 h-5" />
                            </button>
                            <button onClick={bulkDelete} disabled={selectedIds.size === 0} className="text-red-400 disabled:opacity-30">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <MessageInput
                        onSend={handleSend}
                        onAttach={handleAttachType}
                        onTyping={notifyTyping}
                        onStopTyping={notifyStopped}
                        isDisabled={disabled}
                        showAgreementOption={showAgreementOption}
                        showPollOption={isCommunity}
                        replyTo={replyTarget}
                        onCancelReply={() => setReplyTarget(null)}
                    />
                )}
            </div>

            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { uploadAndSend(e.target.files, 'IMAGE'); e.target.value = '' }}
            />
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={e => { uploadAndSend(e.target.files); e.target.value = '' }}
            />
            <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={e => { uploadAndSend(e.target.files, 'VIDEO'); e.target.value = '' }}
            />
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => { uploadAndSend(e.target.files, 'FILE'); e.target.value = '' }}
            />

            <AudioRecorderSheet
                open={showAudioRecorder}
                onClose={() => setShowAudioRecorder(false)}
                onSend={handleSendAudio}
            />

            <StickerPickerSheet
                open={showStickerPicker}
                onClose={() => setShowStickerPicker(false)}
                onSelect={handleSendSticker}
            />

            {viewerItems && (
                <MediaViewport
                    items={viewerItems.items}
                    initialIndex={viewerItems.index}
                    onClose={() => setViewerItems(null)}
                />
            )}

            <MessageActionMenu
                open={!!actionMessage}
                anchorRect={actionAnchor}
                align={actionMessage?.senderId === currentUserId ? 'right' : 'left'}
                onClose={closeActionMenu}
                items={actionMessage ? buildActionItems(actionMessage) : []}
            />

            {infoPanel}

            {reviewOrder && (
                <OrderReviewSheet
                    storeName={header.name}
                    onClose={closeReviewSheet}
                    onSubmit={submitReview}
                />
            )}
        </div>
    )
}

function MessageRow({
    isSent,
    selectionMode,
    isSelected,
    onToggleSelect,
    onLongPress,
    onSwipeReply,
    children,
}: {
    isSent: boolean
    selectionMode: boolean
    isSelected: boolean
    onToggleSelect: () => void
    onLongPress: (rect: DOMRect) => void
    onSwipeReply: () => void
    children: React.ReactNode
}) {
    const rowRef = useRef<HTMLDivElement>(null)
    const longPress = useLongPress(() => {
        const rect = rowRef.current?.getBoundingClientRect()
        if (rect) onLongPress(rect)
    })
    const { offset, handlers: swipeHandlers } = useSwipeToReply(onSwipeReply, selectionMode)

    // Both hooks define onTouchStart/Move/End/Cancel — spreading one after the
    // other would let it silently clobber the first, so merge instead of spread.
    const touchHandlers = selectionMode ? swipeHandlers : {
        onTouchStart: (e: React.TouchEvent) => { longPress.onTouchStart(e); swipeHandlers.onTouchStart(e) },
        onTouchMove: (e: React.TouchEvent) => { longPress.onTouchMove(e); swipeHandlers.onTouchMove(e) },
        onTouchEnd: (e: React.TouchEvent) => { longPress.onTouchEnd(); swipeHandlers.onTouchEnd() },
        onTouchCancel: (e: React.TouchEvent) => { longPress.onTouchCancel(); swipeHandlers.onTouchCancel() },
    }

    return (
        <div className="relative flex items-center">
            {selectionMode && (
                <button
                    onClick={onToggleSelect}
                    className={`shrink-0 ml-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/30'
                    }`}
                >
                    {isSelected && <SelectIcon className="w-3 h-3 text-white" />}
                </button>
            )}
            <div
                ref={rowRef}
                className="flex-1 min-w-0"
                onClick={selectionMode ? onToggleSelect : undefined}
                style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? 'transform 150ms ease-out' : undefined }}
                onMouseDown={selectionMode ? undefined : longPress.onMouseDown}
                onMouseMove={selectionMode ? undefined : longPress.onMouseMove}
                onMouseUp={selectionMode ? undefined : longPress.onMouseUp}
                onMouseLeave={selectionMode ? undefined : longPress.onMouseLeave}
                onContextMenu={selectionMode ? undefined : longPress.onContextMenu}
                {...touchHandlers}
            >
                {children}
            </div>
            {offset < 0 && (
                <div
                    className={`absolute ${isSent ? 'right-1' : 'left-1'} text-white/30 pointer-events-none`}
                    style={{ opacity: Math.min(1, -offset / 48) }}
                >
                    <ReplyIcon className="w-4 h-4" />
                </div>
            )}
        </div>
    )
}
