'use client'

import { useState } from 'react'
import { formatNaira } from '@/lib/filterconfig'
import { orderApi } from '@/lib/api/order'
import { listingApi } from '@/lib/api/listing'
import { ListingModal } from '@/components/community/ListingModal'
import type { FavoritedListing } from '@/types'

type Props = {
    listing: FavoritedListing
    onUnfavorite: () => void
}

export function FavoriteCard({ listing, onUnfavorite }: Props) {
    const cover = listing.media[0]
    const [ordering, setOrdering] = useState(false)
    const [ordered, setOrdered] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)

    const handleRemove = async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await listingApi.unfavorite(listing.id)
        } finally {
            onUnfavorite()
        }
    }

    const placeOrder = async () => {
        if (ordering || ordered) return
        setOrdering(true)
        try {
            await orderApi.create(listing.communityId, [{ listingId: listing.id, quantity: 1 }])
            setOrdered(true)
        } catch {
            // no-op — button re-enables so the user can retry
        } finally {
            setOrdering(false)
        }
    }

    const handleOrder = async (e: React.MouseEvent) => {
        e.stopPropagation()
        placeOrder()
    }

    const handleUnfavoriteFromModal = async () => {
        try {
            await listingApi.unfavorite(listing.id)
        } finally {
            setModalOpen(false)
            onUnfavorite()
        }
    }

    return (
        <div
            onClick={() => setModalOpen(true)}
            className="flex gap-3 p-3 rounded-2xl bg-[#1c1c1e] border border-white/8 cursor-pointer active:scale-[0.99] transition-transform"
        >
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5">
                {cover?.type === 'video' ? (
                    <video src={cover.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                ) : cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt={listing.title} className="w-full h-full object-cover" />
                ) : null}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
                <p className="text-sm text-white font-medium leading-snug line-clamp-2">{listing.title}</p>
                <p className="text-base text-white font-semibold mt-1">{formatNaira(listing.price)}</p>
                {listing.community?.name && (
                    <p className="text-xs text-white/40 truncate mt-0.5">{listing.community.name}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-2">
                    <button
                        onClick={handleRemove}
                        className="text-xs font-medium text-orange-400 active:opacity-70"
                    >
                        Remove
                    </button>
                    <button
                        onClick={handleOrder}
                        disabled={ordering || ordered}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors
                            ${ordered ? 'bg-white/10 text-white/40' : 'bg-orange-400 text-black active:bg-orange-300'}
                            disabled:opacity-60`}
                    >
                        {ordered ? 'Ordered' : ordering ? 'Ordering…' : 'Order'}
                    </button>
                </div>
            </div>

            {modalOpen && (
                <ListingModal
                    listing={listing}
                    favorited={true}
                    onFavorite={handleUnfavoriteFromModal}
                    onOrder={placeOrder}
                    onViewReviews={() => {}}
                    onShare={() => {}}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    )
}
