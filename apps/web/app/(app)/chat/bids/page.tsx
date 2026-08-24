'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { bidApi } from '@/lib/api/bid'
import { BidCard } from '@/components/bid/BidCard'
import { BidSeekHeader } from '@/components/bid/BidSeekHeader'
import TabPicker from '@/components/chat/TabPicker'
import ChatHeader from '@/components/chat/ChatHeader'
import type { MyBid, ReceivedBid } from '@/types'

export default function BidsPage() {
    const router = useRouter()
    const { user } = useAuth()

    const [placed, setPlaced] = useState<MyBid[]>([])
    const [received, setReceived] = useState<ReceivedBid[]>([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!user) return
        let cancelled = false
        Promise.all([
            bidApi.getMyBids().catch(() => ({ data: [] })),
            bidApi.getReceivedBids().catch(() => ({ data: [] })),
        ]).then(([myRes, receivedRes]) => {
            if (cancelled) return
            setPlaced(myRes.data ?? [])
            setReceived(receivedRes.data ?? [])
        }).finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [user])

    async function handleWithdraw(id: string) {
        setBusyId(id)
        try {
            await bidApi.withdraw(id)
            setPlaced(prev => prev.map(b => b.id === id ? { ...b, status: 'WITHDRAWN' } : b))
        } catch (err) {
            console.error(err)
        } finally {
            setBusyId(null)
        }
    }

    async function handleAccept(id: string) {
        setBusyId(id)
        try {
            await bidApi.select(id)
            setReceived(prev => prev.map(b => b.id === id ? { ...b, status: 'SELECTED' } : b))
            router.push('/chat')
        } catch (err) {
            console.error(err)
        } finally {
            setBusyId(null)
        }
    }

    async function handleDecline(id: string) {
        setBusyId(id)
        try {
            await bidApi.reject(id)
            setReceived(prev => prev.map(b => b.id === id ? { ...b, status: 'REJECTED' } : b))
        } catch (err) {
            console.error(err)
        } finally {
            setBusyId(null)
        }
    }

    const q = search.trim().toLowerCase()
    const filteredReceived = received.filter(bid => !q || bid.seek.content.toLowerCase().includes(q))
    const filteredPlaced = placed.filter(bid => !q || bid.seek.content.toLowerCase().includes(q) || bid.seek.author.name.toLowerCase().includes(q))
    const hasAny = filteredPlaced.length > 0 || filteredReceived.length > 0

    return (
        <div className="min-h-full pb-8">
            <ChatHeader title="Bids" search={search} onSearchChange={setSearch} />
            <TabPicker />

            {!user || loading ? (
                <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                    Loading…
                </div>
            ) : !hasAny ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <span className="text-4xl mb-3">📋</span>
                    <h1 className="text-lg font-semibold text-white">No bids yet</h1>
                    <p className="mt-1 text-sm text-white/40">Bids you place and bids on your seeks show up here.</p>
                </div>
            ) : (
                <div className="px-4 space-y-6 mt-2">
                    {filteredReceived.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-semibold text-white/70">Bids on your seeks</h2>
                            {filteredReceived.map(bid => (
                                <div
                                    key={bid.id}
                                    className="space-y-1.5 cursor-pointer"
                                    onClick={() => router.push(`/chat/bids/${bid.id}`)}
                                >
                                    <div onClick={e => e.stopPropagation()}>
                                        <BidSeekHeader
                                            seekId={bid.seek.id}
                                            content={bid.seek.content}
                                            type={bid.seek.type}
                                            location={bid.seek.location}
                                        />
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <BidCard
                                            bid={bid}
                                            currentUserId={user.id}
                                            loading={busyId === bid.id}
                                            onAccept={() => handleAccept(bid.id)}
                                            onDecline={() => handleDecline(bid.id)}
                                            onWithdraw={() => {}}
                                        />
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}

                    {filteredPlaced.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-sm font-semibold text-white/70">Bids you've placed</h2>
                            {filteredPlaced.map(bid => (
                                <div
                                    key={bid.id}
                                    className="space-y-1.5 cursor-pointer"
                                    onClick={() => router.push(`/chat/bids/${bid.id}`)}
                                >
                                    <div onClick={e => e.stopPropagation()}>
                                        <BidSeekHeader
                                            seekId={bid.seek.id}
                                            content={bid.seek.content}
                                            type={bid.seek.type}
                                            location={bid.seek.location}
                                        />
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <BidCard
                                            bid={bid}
                                            currentUserId={user.id}
                                            displayUser={bid.seek.author}
                                            loading={busyId === bid.id}
                                            onAccept={() => {}}
                                            onDecline={() => {}}
                                            onWithdraw={() => handleWithdraw(bid.id)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
