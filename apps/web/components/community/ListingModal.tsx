'use client'

import { useState } from 'react'
import { formatNaira } from '@/lib/filterconfig'
import { isVideoUrl } from '@/lib/marketplaceConfig'
import type { Listing } from '@/types'

type Props = {
    listing: Listing
    favorited: boolean
    onFavorite: () => void
    onOrder: () => void
    onViewReviews: () => void
    onShare: () => void
    onClose: () => void
}

export function ListingModal({ listing, favorited, onFavorite, onOrder, onViewReviews, onShare, onClose }: Props) {
    const [expanded, setExpanded] = useState(false)
    const cover = listing.images[0]
    const coverIsVideo = !!cover && isVideoUrl(cover)

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end bg-black/60"
            onClick={onClose}
        >
            <div
                className="w-full max-h-[88vh] overflow-y-auto bg-neutral-100 rounded-t-3xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-black/20" />
                </div>

                <div className="px-5 pb-4 flex justify-center">
                    {coverIsVideo ? (
                        <video src={cover} className="max-h-72 object-contain" muted playsInline controls />
                    ) : (
                        <img src={cover} alt={listing.title} className="max-h-72 object-contain" />
                    )}
                </div>

                <div className="px-5 pb-6">
                    <div className="flex items-start justify-between gap-3">
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="flex-1 min-w-0 text-left"
                        >
                            {listing.community?.name && (
                                <p className="text-xs text-black/50 font-medium truncate">{listing.community.name}</p>
                            )}
                            <p className="text-lg font-bold text-black leading-snug">{listing.title}</p>
                            <p className="text-lg font-bold text-black mt-1">{formatNaira(listing.price)}</p>
                        </button>

                        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                            <button onClick={onShare} className="text-xs text-black/50 underline">Share</button>
                            <button onClick={onViewReviews} className="text-xs text-black/50 underline">reviews</button>
                        </div>
                    </div>

                    {expanded && listing.description && (
                        <p className="mt-3 text-sm text-black/70 leading-relaxed whitespace-pre-wrap">
                            {listing.description}
                        </p>
                    )}

                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={onFavorite}
                            className={`flex-1 py-3 rounded-full text-sm font-semibold transition-colors
                                ${favorited ? 'bg-black/10 text-black' : 'bg-black text-white'}`}
                        >
                            {favorited ? 'Favorited' : 'Favorite'}
                        </button>
                        <button
                            onClick={onOrder}
                            className="flex-1 py-3 rounded-full border border-black text-black text-sm font-semibold"
                        >
                            Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
