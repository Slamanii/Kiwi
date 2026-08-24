'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { conversationApi, type ConversationType } from '@/lib/api/conversation'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type ConversationMessage = {
    id: string
    type: string
    content?: string | null
    mediaUrl?: string | null
    fileName?: string | null
    createdAt: string
    sender: { id: string; name: string; profile?: { avatarUrl?: string } }
}

type ControlPanelProps = {
    type: ConversationType
    conversationId: string
    name: string
    avatarUrl?: string | null
    subtitle?: string
    otherUserId?: string
    initialMuted?: boolean
    initialPinned?: boolean
    onClose: () => void
    onCleared?: () => void
    onBlocked?: () => void
}

type View = 'main' | 'media' | 'search'

export default function ControlPanel({
    type,
    conversationId,
    name,
    avatarUrl,
    subtitle,
    otherUserId,
    initialMuted,
    initialPinned,
    onClose,
    onCleared,
    onBlocked,
}: ControlPanelProps) {
    const [view, setView] = useState<View>('main')
    const [muted, setMuted] = useState(!!initialMuted)
    const [pinned, setPinned] = useState(!!initialPinned)
    const [blocked, setBlocked] = useState(false)
    const [busy, setBusy] = useState(false)

    const [media, setMedia] = useState<ConversationMessage[]>([])
    const [mediaLoading, setMediaLoading] = useState(false)

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ConversationMessage[]>([])
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        if (view !== 'media') return
        setMediaLoading(true)
        conversationApi.getMedia(type, conversationId)
            .then(res => setMedia(res.data.messages))
            .catch(console.error)
            .finally(() => setMediaLoading(false))
    }, [view, type, conversationId])

    useEffect(() => {
        if (view !== 'search') return
        const q = query.trim()
        if (!q) { setResults([]); return }
        const handle = setTimeout(() => {
            setSearching(true)
            conversationApi.search(type, conversationId, q)
                .then(res => setResults(res.data.messages))
                .catch(console.error)
                .finally(() => setSearching(false))
        }, 300)
        return () => clearTimeout(handle)
    }, [view, query, type, conversationId])

    async function toggleMuted() {
        const next = !muted
        setMuted(next)
        try {
            await conversationApi.setMuted(type, conversationId, next)
        } catch {
            setMuted(!next)
        }
    }

    async function togglePinned() {
        const next = !pinned
        setPinned(next)
        try {
            await conversationApi.setPinned(type, conversationId, next)
        } catch {
            setPinned(!next)
        }
    }

    async function toggleBlocked() {
        if (!otherUserId || busy) return
        setBusy(true)
        try {
            if (blocked) {
                await conversationApi.unblockUser(otherUserId)
                setBlocked(false)
            } else {
                await conversationApi.blockUser(otherUserId)
                setBlocked(true)
                onBlocked?.()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setBusy(false)
        }
    }

    async function handleClear() {
        if (busy) return
        if (!confirm('Clear this conversation? This deletes all messages for everyone.')) return
        setBusy(true)
        try {
            await conversationApi.clearConversation(type, conversationId)
            onCleared?.()
            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            <div className="relative w-full bg-neutral-900 rounded-t-3xl pt-4 pb-10 z-10 max-h-[85vh] flex flex-col">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />

                {view === 'main' && (
                    <div className="overflow-y-auto px-4 space-y-5">
                        <div className="flex flex-col items-center gap-2 pb-2">
                            <Avatar src={avatarUrl} name={name} size="lg" />
                            <div className="text-center">
                                <p className="text-white font-semibold text-base">{name}</p>
                                {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Row label="Muted" onClick={toggleMuted}>
                                <Switch on={muted} />
                            </Row>
                            <Row label="Pinned" onClick={togglePinned}>
                                <Switch on={pinned} />
                            </Row>
                            <Row label="Media, links and files" onClick={() => setView('media')} chevron />
                            <Row label="Search in conversation" onClick={() => setView('search')} chevron />
                        </div>

                        <div className="space-y-1 pt-2 border-t border-white/10">
                            {otherUserId && (
                                <Row
                                    label={blocked ? 'Unblock user' : 'Block user'}
                                    onClick={toggleBlocked}
                                    danger
                                />
                            )}
                            <Row label="Clear chat" onClick={handleClear} danger />
                        </div>
                    </div>
                )}

                {view === 'media' && (
                    <div className="flex flex-col min-h-0 flex-1">
                        <PanelHeader title="Media, links and files" onBack={() => setView('main')} />
                        <div className="overflow-y-auto px-4 pt-2">
                            {mediaLoading ? (
                                <p className="text-white/30 text-sm text-center py-10">Loading…</p>
                            ) : media.length === 0 ? (
                                <p className="text-white/30 text-sm text-center py-10">No media shared yet.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-1">
                                    {media.map(m => (
                                        <a
                                            key={m.id}
                                            href={m.mediaUrl ?? '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="aspect-square bg-white/5 rounded-md overflow-hidden flex items-center justify-center"
                                        >
                                            {m.type === 'VIDEO' ? (
                                                <video src={m.mediaUrl ?? ''} className="w-full h-full object-cover" />
                                            ) : m.type === 'FILE' ? (
                                                <span className="text-white/40 text-[11px] px-1 text-center truncate">{m.fileName ?? 'File'}</span>
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={m.mediaUrl ?? ''} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === 'search' && (
                    <div className="flex flex-col min-h-0 flex-1">
                        <PanelHeader title="Search in conversation" onBack={() => setView('main')} />
                        <div className="px-4 pt-2 pb-3 shrink-0">
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search messages"
                                className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none"
                            />
                        </div>
                        <div className="overflow-y-auto px-4 space-y-3">
                            {searching ? (
                                <p className="text-white/30 text-sm text-center py-10">Searching…</p>
                            ) : results.length === 0 ? (
                                <p className="text-white/30 text-sm text-center py-10">
                                    {query.trim() ? 'No messages found.' : 'Type to search this conversation.'}
                                </p>
                            ) : (
                                results.map(m => (
                                    <div key={m.id} className="pb-3 border-b border-white/5">
                                        <p className="text-white/40 text-[11px] mb-0.5">{m.sender.name}</p>
                                        <p className="text-white text-sm">{m.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <div className="flex items-center gap-3 px-4 pb-3 border-b border-white/10 shrink-0">
            <button onClick={onBack} className="text-white" aria-label="Back">
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <p className="text-white font-semibold text-sm">{title}</p>
        </div>
    )
}

function Row({ label, onClick, children, chevron, danger }: { label: string; onClick: () => void; children?: React.ReactNode; chevron?: boolean; danger?: boolean }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
        >
            <span className={`text-sm ${danger ? 'text-red-400' : 'text-white/90'}`}>{label}</span>
            {children}
            {chevron && <span className="text-white/20 text-sm">›</span>}
        </button>
    )
}

function Switch({ on }: { on: boolean }) {
    return (
        <div className={`w-9 h-5 rounded-full transition-colors relative ${on ? 'bg-blue-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`} />
        </div>
    )
}
