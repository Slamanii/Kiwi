'use client'

import { currencySymbol } from '@/lib/currency'
import { conditionLabel, isVideoUrl } from '@/lib/marketplaceConfig'
import { FavoriteButton } from '@/components/community/FavoriteButton'
import type { Listing } from '@/types'

type Props = {
    listing: Listing
    onClick: () => void
}

export function ListingCard({ listing, onClick }: Props) {
    const cover = listing.images[0]
    const coverIsVideo = !!cover && isVideoUrl(cover)

    return (
        <div
            onClick={onClick}
            className="relative rounded-2xl overflow-hidden cursor-pointer
                active:scale-[0.98] transition-transform mb-3 break-inside-avoid"
        >
            <div className="relative">
                {coverIsVideo ? (
                    <video
                        src={cover}
                        className="w-full h-auto object-cover"
                        muted
                        playsInline
                        preload="metadata"
                    />
                ) : (
                    <img
                        src={cover}
                        alt={listing.title}
                        className="w-full h-auto object-cover"
                    />
                )}

                <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white/80">
                        {conditionLabel(listing.condition)}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {listing.location && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 truncate max-w-24">
                                {listing.location}
                            </span>
                        )}
                        <FavoriteButton listingId={listing.id} initialFavorited={listing.favorited} size="sm" />
                    </div>
                </div>
            </div>

            <div className="px-2.5 pt-2 pb-3 text-center">
                <p className="text-white text-sm font-semibold truncate">{listing.title}</p>
                <p className="text-white/50 text-xs mt-0.5">
                    {currencySymbol(listing.currency)}{listing.price.toLocaleString()}
                </p>
            </div>
        </div>
    )
}
