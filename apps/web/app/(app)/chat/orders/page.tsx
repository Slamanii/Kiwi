'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useOrderConversations } from '@/hooks/useOrderConversations'
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

export default function OrdersListPage() {
    const { user } = useAuth()
    const { conversations, loading } = useOrderConversations()
    const [search, setSearch] = useState('')

    const rows = conversations.filter(c => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (c.community?.name ?? '').toLowerCase().includes(q) || (c.lastMessage ?? '').toLowerCase().includes(q)
    })

    return (
        <div className="min-h-full">
            <ChatHeader title="Orders" search={search} onSearchChange={setSearch} />
            <TabPicker />

            {!user || loading ? (
                <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                    Loading…
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <h1 className="text-lg font-semibold text-white">No order chats yet</h1>
                    <p className="mt-1 text-sm text-white/40">Conversations with stores about your orders show up here.</p>
                </div>
            ) : (
                <div className="mt-2">
                    {rows.map(c => (
                        <ChatListItem
                            key={c.id}
                            name={c.community?.name ?? 'Store'}
                            avatarUrl={c.community?.avatarUrl}
                            lastMessage={c.lastMessage ?? 'No messages yet'}
                            timestamp={formatRelative(c.lastMessageAt)}
                            unreadCount={c.unreadCount}
                            href={`/orders/${c.id}`}
                            type="ORDER"
                            conversationId={c.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
