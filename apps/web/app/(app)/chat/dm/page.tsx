'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useDMConversations } from '@/hooks/useDMConversations'
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

export default function DMListPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { conversations, loading } = useDMConversations()
    const typingIds = useTypingList('dm')
    const [search, setSearch] = useState('')

    const rows = conversations.filter(c => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return c.otherUser.name.toLowerCase().includes(q) || (c.lastMessage ?? '').toLowerCase().includes(q)
    })

    return (
        <div className="min-h-full">
            <ChatHeader
                title="Chats"
                search={search}
                onSearchChange={setSearch}
                onCompose={() => router.push('/explore')}
            />
            <TabPicker />

            {!user || loading ? (
                <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                    Loading…
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="text-4xl mb-3">💬</span>
                    <h1 className="text-lg font-semibold text-white">No chats yet</h1>
                    <p className="mt-1 text-sm text-white/40">Direct messages with agents will show up here.</p>
                </div>
            ) : (
                <div className="mt-2">
                    {rows.map(c => (
                        <ChatListItem
                            key={c.id}
                            name={c.otherUser.name}
                            avatarUrl={c.otherUser.profile?.avatarUrl}
                            lastMessage={c.lastMessage ?? 'Say hello 👋'}
                            timestamp={formatRelative(c.lastMessageAt)}
                            unreadCount={c.unreadCount}
                            isTyping={typingIds.has(c.id)}
                            href={`/chat/dm/${c.otherUser.id}`}
                            type="DM"
                            conversationId={c.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
