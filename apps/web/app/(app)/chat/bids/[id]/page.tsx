'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { bidApi } from '@/lib/api/bid'
import { Avatar } from '@/components/ui/Avatar'
import { RatingStars } from '@/components/profile/RatingStars'
import { currencySymbol } from '@/lib/currency'
import type { BidDetail } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

export default function BidDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()

    const [bid, setBid] = useState<BidDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let cancelled = false
        bidApi.getById(id)
            .then(res => { if (!cancelled) setBid(res.data) })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [id])

    if (!user || loading || !bid) {
        return (
            <div className="min-h-full flex items-center justify-center text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    const isSeekOwner = bid.seek.authorId === user.id
    const isMyBid = bid.agentId === user.id
    const isPending = bid.status === 'PENDING'

    async function withAction(fn: () => Promise<any>) {
        setBusy(true)
        try {
            await fn()
            router.back()
        } catch (err) {
            console.error(err)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="min-h-full pb-8">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <button onClick={() => router.back()} className="text-white/50 cursor-pointer" aria-label="Back">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-semibold text-white">Bid details</h1>
            </div>

            <div className="px-4 mt-2 space-y-4">
                {/* Seek context */}
                <div
                    className="bg-[#1c1c1e] rounded-2xl p-4 space-y-2 cursor-pointer"
                    onClick={() => router.push(`/seek/${bid.seek.id}`)}
                >
                    <div className="flex items-center gap-2">
                        <Avatar src={bid.seek.author.profile?.avatarUrl} name={bid.seek.author.name} size="sm" />
                        <span className="text-xs font-medium text-white/70">{bid.seek.author.name}</span>
                    </div>
                    <p className="text-sm text-white/80">{bid.seek.content}</p>
                    <p className="text-xs text-white/40">
                        {bid.seek.type.replace(/_/g, ' ')}
                        {bid.seek.location ? ` · ${bid.seek.location}` : ''}
                        {bid.seek.budget ? ` · ${currencySymbol(bid.seek.currency)}${bid.seek.budget.toLocaleString()}` : ''}
                    </p>
                </div>

                {/* Bid info */}
                <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Avatar src={bid.agent.profile?.avatarUrl} name={bid.agent.name} size="md" />
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-white truncate">{bid.agent.name}</span>
                            {bid.agent.profile?.rating !== undefined && (
                                <div className="mt-0.5">
                                    <RatingStars rating={bid.agent.profile.rating} size="sm" />
                                </div>
                            )}
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                            <p className="text-xs text-blue-400 font-bold">{bid.rate}% fee</p>
                            <p className="text-xs text-white/50">{currencySymbol(bid.currency)}{bid.amount.toLocaleString()}</p>
                        </div>
                    </div>

                    {bid.message && (
                        <p className="text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3">
                            {bid.message}
                        </p>
                    )}

                    {!isPending && (
                        <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full
                            bg-white/8 text-white/40">
                            {bid.status === 'SELECTED' ? '✓ Accepted' : bid.status === 'WITHDRAWN' ? 'Withdrawn' : '✕ Declined'}
                        </span>
                    )}
                </div>

                {/* Actions — only the role-appropriate buttons, only while pending */}
                {isPending && isMyBid && (
                    <button
                        onClick={() => withAction(() => bidApi.withdraw(bid.id))}
                        disabled={busy}
                        className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400
                            text-sm active:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                        Withdraw Bid
                    </button>
                )}

                {isPending && isSeekOwner && !isMyBid && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => withAction(() => bidApi.reject(bid.id))}
                            disabled={busy}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5
                                border border-white/10 rounded-xl text-white/40 text-sm
                                active:bg-white/5 transition-colors disabled:opacity-40"
                        >
                            <span>✕</span> Decline
                        </button>
                        <button
                            onClick={() => withAction(() => bidApi.select(bid.id))}
                            disabled={busy}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5
                                bg-blue-500 rounded-xl text-white text-sm font-medium
                                active:bg-blue-600 transition-colors disabled:opacity-40"
                        >
                            <span>✓</span> Accept
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
