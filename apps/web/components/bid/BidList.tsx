'use client'

import { useState, useEffect } from 'react'
import { BidCard } from './BidCard'
import { bidApi } from '@/lib/api/bid'
import type { Bid } from '@/types'

type BidListProps = {
    seekId: string
    isOwner: boolean
    currentUserId?: string
}

export function BidList({ seekId, isOwner, currentUserId }: BidListProps) {
    const [bids,    setBids]    = useState<Bid[]>([])
    const [loading, setLoading] = useState(true)
    const [acting,  setActing]  = useState<string | null>(null)

    useEffect(() => {
        bidApi.getBySeek(seekId)
            .then(res => setBids(res.data.bids ?? res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [seekId])

    const handleAccept = async (bid: Bid) => {
        setActing(bid.id)
        try {
            await bidApi.select(bid.id)
            setBids(prev => prev.map(b => ({
                ...b,
                status: b.id === bid.id ? 'SELECTED' : 'REJECTED',
            })))
        } catch (err) { console.error(err) }
        finally { setActing(null) }
    }

    const handleDecline = async (bid: Bid) => {
        setActing(bid.id)
        try {
            await bidApi.reject(bid.id)
            setBids(prev => prev.filter(b => b.id !== bid.id))
        } catch (err) { console.error(err) }
        finally { setActing(null) }
    }

    const handleWithdraw = async (bid: Bid) => {
        setActing(bid.id)
        try {
            await bidApi.withdraw(bid.id)
            setBids(prev => prev.filter(b => b.id !== bid.id))
        } catch (err) { console.error(err) }
        finally { setActing(null) }
    }

    if (!isOwner && !bids.some(b => b.agentId === currentUserId)) {
        return (
            <div className="py-12 text-center px-6">
                <p className="text-white/25 text-sm">
                    This is not your post — you can't see bids.
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-3 px-4">
                {[0, 1].map(i => (
                    <div key={i} className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-3 w-24 bg-white/10 rounded" />
                                <div className="h-2 w-16 bg-white/10 rounded" />
                            </div>
                        </div>
                        <div className="h-8 bg-white/5 rounded-xl" />
                    </div>
                ))}
            </div>
        )
    }

    if (bids.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-white/25 text-sm">No bids yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3 px-4">
            {bids.map(bid => (
                <BidCard
                    key={bid.id}
                    bid={bid}
                    currentUserId={currentUserId}
                    loading={acting === bid.id}
                    onAccept={() => handleAccept(bid)}
                    onDecline={() => handleDecline(bid)}
                    onWithdraw={() => handleWithdraw(bid)}
                />
            ))}
        </div>
    )
}