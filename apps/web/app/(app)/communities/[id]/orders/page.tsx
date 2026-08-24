'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { communityApi } from '@/lib/api/community'
import { orderApi } from '@/lib/api/order'
import { OrderCard } from '@/components/community/OrderCard'
import ChatListItem from '@/components/chat/ChatListItem'
import type { Community, Order, StoreConversation } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

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

type SubTab = 'queue' | 'chats'

export default function CommunityOrdersPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()

    const [subTab, setSubTab] = useState<SubTab>('queue')

    const [community, setCommunity] = useState<Community | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [busyOrderId, setBusyOrderId] = useState<string | null>(null)

    const [conversations, setConversations] = useState<StoreConversation[]>([])
    const [conversationsLoading, setConversationsLoading] = useState(true)

    useEffect(() => {
        communityApi.getById(id).then(res => setCommunity(res.data)).catch(console.error)
    }, [id])

    useEffect(() => {
        setLoading(true)
        orderApi.getCommunityOrders(id)
            .then(res => {
                setOrders(res.data.orders)
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    useEffect(() => {
        if (subTab !== 'chats') return
        setConversationsLoading(true)
        orderApi.getCommunityConversations(id)
            .then(res => setConversations(res.data))
            .catch(console.error)
            .finally(() => setConversationsLoading(false))
    }, [id, subTab])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await orderApi.getCommunityOrders(id, cursor)
            setOrders(prev => [...prev, ...res.data.orders])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, id])

    async function handleFollowUp(order: Order) {
        if (!user || busyOrderId) return
        setBusyOrderId(order.id)
        try {
            const buyerName = order.buyer?.name ?? 'there'
            const res = await orderApi.followUp(order.id, `Hi ${buyerName}, I'm following up on your order.`)
            router.push(`/orders/${res.data.conversationId}`)
        } catch (err: any) {
            window.alert(err.response?.data?.error ?? 'Something went wrong')
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'ADMIN_CONTACTED' } : o))
        } finally {
            setBusyOrderId(null)
        }
    }

    if (!user) {
        return (
            <div className="min-h-full flex items-center justify-center text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    return (
        <div className="min-h-full pb-8">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <button onClick={() => router.back()} className="text-white/50 cursor-pointer" aria-label="Back">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-sm font-semibold text-white">Orders</h1>
                    {community && <p className="text-xs text-white/40 truncate">{community.name}</p>}
                </div>
            </div>

            <div className="flex items-center gap-1 mx-4 mt-2 bg-white/5 rounded-full p-1">
                {(['queue', 'chats'] as SubTab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setSubTab(t)}
                        className={`flex-1 text-center text-xs font-medium py-1.5 rounded-full transition-colors
                            ${subTab === t ? 'bg-cyan-400 text-black' : 'text-white/50'}`}
                    >
                        {t === 'queue' ? 'Queue' : 'Chats'}
                    </button>
                ))}
            </div>

            {subTab === 'chats' ? (
                <div className="mt-2">
                    {conversationsLoading ? (
                        <div className="flex items-center justify-center py-16 text-white/30 text-sm">Loading…</div>
                    ) : conversations.length === 0 ? (
                        <div className="flex items-center justify-center py-16 text-white/30 text-sm">No conversations yet.</div>
                    ) : (
                        conversations.map(c => (
                            <ChatListItem
                                key={c.id}
                                name={c.buyer?.name ?? 'Buyer'}
                                avatarUrl={c.buyer?.profile?.avatarUrl}
                                lastMessage={c.lastMessage ?? 'No messages yet'}
                                timestamp={formatRelative(c.lastMessageAt)}
                                unreadCount={c.unreadCount}
                                href={`/orders/${c.id}`}
                                type="ORDER"
                                conversationId={c.id}
                            />
                        ))
                    )}
                </div>
            ) : (
            <div className="px-4 mt-2 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-white/30 text-sm">Loading…</div>
                ) : orders.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-white/30 text-sm">No open orders.</div>
                ) : (
                    <>
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                currentUserId={user.id}
                                onFollowUp={() => handleFollowUp(order)}
                                loading={busyOrderId === order.id}
                            />
                        ))}
                        {hasMore && (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="w-full py-2.5 rounded-xl border border-white/10 text-white/50
                                    text-sm active:bg-white/5 transition-colors disabled:opacity-40"
                            >
                                {loadingMore ? 'Loading…' : 'Load more'}
                            </button>
                        )}
                    </>
                )}
            </div>
            )}
        </div>
    )
}
