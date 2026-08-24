'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useThreadList } from '@/hooks/useThreadList'
import { useTypingList } from '@/hooks/useTyping'
import ChatListItem from '@/components/chat/ChatListItem'
import TabPicker from '@/components/chat/TabPicker'
import ChatHeader from '@/components/chat/ChatHeader'

function formatRelative(iso?: string) {
    if (!iso) return ''
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

export default function ChatPage() {
    const { user } = useAuth()
    const { threads, loading } = useThreadList()
    const typingIds = useTypingList('thread')
    const [search, setSearch] = useState('')

    const rows = threads
        .slice()
        .sort((a, b) => {
            const at = new Date(a.messages[a.messages.length - 1]?.createdAt ?? a.updatedAt).getTime()
            const bt = new Date(b.messages[b.messages.length - 1]?.createdAt ?? b.updatedAt).getTime()
            return bt - at
        })
        .map(t => {
            const isClient = t.clientId === user?.id
            const other = isClient ? t.agent : t.client
            const lastMessage = t.messages[t.messages.length - 1]
            return { thread: t, other, lastMessage }
        })
        .filter(({ other, lastMessage }) => {
            const q = search.trim().toLowerCase()
            if (!q) return true
            return other.name.toLowerCase().includes(q) || (lastMessage?.content ?? '').toLowerCase().includes(q)
        })

    return (
        <div className="min-h-full">
            <ChatHeader title="Threads" search={search} onSearchChange={setSearch} showCommunities />
            <TabPicker />

            {!user || loading ? (
                <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                    Loading…
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="text-4xl mb-3">💬</span>
                    <h1 className="text-lg font-semibold text-white">No threads yet</h1>
                    <p className="mt-1 text-sm text-white/40">Deals you open with agents or clients will show up here.</p>
                </div>
            ) : (
                <div className="mt-2">
                    {rows.map(({ thread: t, other, lastMessage }) => (
                        <ChatListItem
                            key={t.id}
                            name={other.name}
                            avatarUrl={other.profile?.avatarUrl}
                            lastMessage={lastMessage?.content ?? t.seek.content}
                            timestamp={formatRelative(lastMessage?.createdAt ?? t.updatedAt)}
                            unreadCount={t.unreadCount}
                            isTyping={typingIds.has(t.id)}
                            href={`/chat/thread/${t.id}`}
                            type="THREAD"
                            conversationId={t.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
