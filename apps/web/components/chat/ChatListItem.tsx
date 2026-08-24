'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AvatarName from './AvatarName'
import ActionSheet, { ActionSheetItem } from './ActionSheet'
import { useLongPress } from '@/hooks/useLongPress'
import { conversationApi, type ConversationType } from '@/lib/api/conversation'
import { PinIcon, ArchiveIcon, TrashIcon } from '@/components/ui/Icons'

function MuteIcon({ className, filled }: { className?: string; filled?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 8a6 6 0 0 0-9.33-5" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
            <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    )
}

type ChatListItemProps = {
    name: string
    lastMessage: string
    timestamp: string
    avatarUrl?: string | null
    unreadCount?: number
    isTyping?: boolean
    href: string
    type?: ConversationType
    conversationId?: string
    initialMuted?: boolean
    initialPinned?: boolean
    onArchived?: () => void
    onDeleted?: () => void
}

export default function ChatListItem({
    name,
    lastMessage,
    timestamp,
    avatarUrl,
    unreadCount,
    isTyping,
    href,
    type,
    conversationId,
    initialMuted,
    initialPinned,
    onArchived,
    onDeleted,
}: ChatListItemProps) {
    const router = useRouter()
    const [showActions, setShowActions] = useState(false)
    const [muted, setMuted] = useState(!!initialMuted)
    const [pinned, setPinned] = useState(!!initialPinned)
    const canAct = !!type && !!conversationId
    const longPress = useLongPress(() => { if (canAct) setShowActions(true) })

    async function toggleMuted() {
        if (!type || !conversationId) return
        const next = !muted
        setMuted(next)
        try {
            await conversationApi.setMuted(type, conversationId, next)
        } catch {
            setMuted(!next)
        }
    }

    async function togglePinned() {
        if (!type || !conversationId) return
        const next = !pinned
        setPinned(next)
        try {
            await conversationApi.setPinned(type, conversationId, next)
        } catch {
            setPinned(!next)
        }
    }

    async function archive() {
        if (!type || !conversationId) return
        try {
            await conversationApi.setArchived(type, conversationId, true)
            onArchived?.()
        } catch (err) {
            console.error(err)
        }
    }

    async function deleteConversation() {
        if (!type || !conversationId) return
        if (!confirm('Delete this conversation? This deletes all messages for everyone.')) return
        try {
            await conversationApi.clearConversation(type, conversationId)
            onDeleted?.()
        } catch (err) {
            console.error(err)
        }
    }

    const actionItems: ActionSheetItem[] = [
        { key: 'pin', label: pinned ? 'Unpin' : 'Pin', icon: <PinIcon className="w-5 h-5" filled={pinned} />, onSelect: togglePinned },
        { key: 'mute', label: muted ? 'Unmute' : 'Mute', icon: <MuteIcon className="w-5 h-5" filled={muted} />, onSelect: toggleMuted },
        { key: 'archive', label: 'Archive', icon: <ArchiveIcon className="w-5 h-5" />, onSelect: archive },
        { key: 'delete', label: 'Delete conversation', icon: <TrashIcon className="w-5 h-5" />, destructive: true, onSelect: deleteConversation },
    ]

    return (
        <div
            onClick={() => { if (!showActions) router.push(href) }}
            className="flex items-center px-4 py-2.5 gap-3 cursor-pointer border-b border-white/5"
            {...(canAct ? longPress : {})}
        >
            <div className="flex-1 min-w-0">
                <AvatarName
                    name={name}
                    avatarUrl={avatarUrl}
                    size="lg"
                    subtitle={isTyping ? 'typing…' : lastMessage}
                    subtitleClassName={isTyping ? 'text-cyan-400' : undefined}
                />
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-white/40 text-[11px]">{timestamp}</span>
                {!!unreadCount && (
                    <div className="bg-blue-500 text-white text-[11px] font-semibold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                        {unreadCount}
                    </div>
                )}
            </div>

            {canAct && (
                <ActionSheet open={showActions} onClose={() => setShowActions(false)} items={actionItems} />
            )}
        </div>
    )
}
