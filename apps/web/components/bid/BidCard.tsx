'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { BidStatus, MediaItem, User } from '@/types'
import { RatingStars } from '@/components/profile/RatingStars'
import { MediaViewport } from '@/components/ui/MediaViewport'
import { currencySymbol } from '@/lib/currency'

type DisplayUser = Pick<User, 'id' | 'name'> & {
    profile?: {
        avatarUrl?: string
        rating?: number
        reviewCount?: number
        verificationStatus?: string
    }
}

// agent is optional — required only when displayUser isn't supplied (e.g. an agent's
// placed-bids view has no bid.agent, since the viewer IS the agent; it passes displayUser instead)
type BidCardData = {
    id: string
    agentId: string
    rate: number
    amount: number
    currency?: string
    message?: string
    images?: string[]
    videoUrl?: string
    status: BidStatus
    agent?: DisplayUser
}

type BidCardProps = {
    bid: BidCardData
    currentUserId?: string
    /** Overrides the info shown (avatar/name/rating) — e.g. an agent's placed-bids view
     *  shows the seek's author here instead of the agent's own info. */
    displayUser?: DisplayUser
    onAccept:   () => void
    onDecline:  () => void
    onWithdraw: () => void
    loading?: boolean
}

export function BidCard({ bid, currentUserId, displayUser, onAccept, onDecline, onWithdraw, loading }: BidCardProps) {
    const agent = displayUser ?? bid.agent ?? { id: bid.agentId, name: 'Unknown' }

    const isVerified = agent.profile?.verificationStatus === 'VERIFIED'
    const isSelected = bid.status === 'SELECTED'
    const isRejected = bid.status === 'REJECTED'
    const isPending  = bid.status === 'PENDING'
    const isMyBid    = currentUserId === bid.agentId

    const [showMedia, setShowMedia] = useState(false)
    const [viewerOpen, setViewerOpen] = useState(false)
    const media: MediaItem[] = [
        ...(bid.images ?? []).map(url => ({ type: 'image' as const, url })),
        ...(bid.videoUrl ? [{ type: 'video' as const, url: bid.videoUrl }] : []),
    ]

    return (
        <div className={`bg-[#1c1c1e] rounded-2xl p-4 space-y-3 border transition-colors
            ${isSelected ? 'border-blue-500/50' : isRejected ? 'border-white/5 opacity-50' : 'border-blue-500/15'}
        `}>
            {/* Status badge */}
            {!isPending && (
                <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full
                    ${isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-white/8 text-white/30'}
                `}>
                    {isSelected ? '✓ Accepted' : '✕ Declined'}
                </span>
            )}

            {/* Agent info */}
            <div className="flex items-center gap-3">
                <Avatar src={agent.profile?.avatarUrl} name={agent.name} size="md" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                            {agent.name}
                        </span>
                        {isVerified && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 shrink-0">
                                Verified
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       {agent.profile?.rating !== undefined && (
                        <RatingStars
                            rating={agent.profile.rating}
                            reviewCount={agent.profile.reviewCount}
                            size="sm"
                        />
                    )}
                    </div>
                </div>

                {/* Rate + Amount */}
                <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs text-blue-400 font-bold">{bid.rate}% fee</p>
                    <p className="text-xs text-white/50">{currencySymbol(bid.currency)}{bid.amount.toLocaleString()}</p>
                </div>
            </div>

            {/* Message */}
            {bid.message && (
                <p className="text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3">
                    {bid.message}
                </p>
            )}

            {/* Actions — only when pending */}
            {isPending && (
                isMyBid ? (
                    // Agent viewing their own bid — withdraw only
                    <button
                        onClick={onWithdraw}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl border border-red-500/40 text-red-400
                            text-sm active:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                        Withdraw Bid
                    </button>
                ) : (
                    // Seek owner — accept or decline
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onDecline}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5
                                border border-white/10 rounded-xl text-white/40 text-sm
                                active:bg-white/5 transition-colors disabled:opacity-40"
                        >
                            <span>✕</span> Decline
                        </button>
                        <button
                            onClick={onAccept}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5
                                bg-blue-500 rounded-xl text-white text-sm font-medium
                                active:bg-blue-600 transition-colors disabled:opacity-40"
                        >
                            <span>✓</span> Accept
                        </button>
                    </div>
                )
            )}

            {/* Media toggle — reveals a peek panel with a static snapshot of the first item;
                tapping the peek opens the shared full-screen MediaViewport to slide through the rest. */}
            {media.length > 0 && (
                <div className="pt-1 space-y-2">
                    <button
                        onClick={() => setShowMedia(v => !v)}
                        className="text-xs text-white/40 flex items-center gap-1"
                    >
                        {showMedia ? 'Hide media ▲' : `Show media (${media.length}) ▼`}
                    </button>

                    {showMedia && (
                        <button
                            onClick={() => setViewerOpen(true)}
                            className="relative w-full h-64 rounded-2xl overflow-hidden bg-white/5 border border-white/8"
                        >
                            {media[0].type === 'video' ? (
                                <video src={media[0].url} className="w-full h-full object-cover" muted />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={media[0].url} alt="" className="w-full h-full object-cover" />
                            )}
                            {media[0].type === 'video' && (
                                <span className="absolute inset-0 flex items-center justify-center text-white text-2xl">▶</span>
                            )}
                            {media.length > 1 && (
                                <span className="absolute bottom-2 right-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full">
                                    +{media.length - 1} more
                                </span>
                            )}
                        </button>
                    )}
                </div>
            )}

            {viewerOpen && (
                <MediaViewport items={media} initialIndex={0} onClose={() => setViewerOpen(false)} />
            )}
        </div>
    )
}