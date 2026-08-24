'use client'

import { Avatar } from '@/components/ui/Avatar'
import { formatNaira } from '@/lib/filterconfig'
import { isVideoUrl } from '@/lib/marketplaceConfig'
import type { Listing } from '@/types'

type ListingMessageBubbleProps = {
    listing: Pick<Listing, 'id' | 'title' | 'description' | 'price' | 'currency' | 'images'>
    isSent: boolean
    timestamp: string
    senderName?: string
    senderAvatarUrl?: string | null
    onOpen: () => void
}

export default function ListingMessageBubble({
    listing,
    isSent,
    timestamp,
    senderName,
    senderAvatarUrl,
    onOpen,
}: ListingMessageBubbleProps) {
    const showSenderInfo = !!senderName && !isSent
    const cover = listing.images[0]
    const coverIsVideo = !!cover && isVideoUrl(cover)

    return (
        <div className={`flex px-4 py-1 gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
            {showSenderInfo && (
                <div className="shrink-0 self-end">
                    <Avatar src={senderAvatarUrl} name={senderName} size="sm" />
                </div>
            )}
            <div className="max-w-[70%]">
                {showSenderInfo && (
                    <div className="text-white/40 text-[11px] mb-1 pl-1">{senderName}</div>
                )}
                <button
                    onClick={onOpen}
                    className={`block w-full text-left overflow-hidden ${
                        isSent
                            ? 'bg-blue-500 rounded-[18px_18px_4px_18px]'
                            : 'bg-[#1c1c1e] rounded-[18px_18px_18px_4px]'
                    }`}
                >
                    {cover && (
                        coverIsVideo ? (
                            <video src={cover} className="w-full max-h-56 object-cover" muted playsInline preload="metadata" />
                        ) : (
                            <img src={cover} alt={listing.title} className="w-full max-h-56 object-cover" />
                        )
                    )}
                    <div className="px-3.5 py-2.5">
                        <p className="text-white text-sm font-semibold truncate">{listing.title}</p>
                        {listing.description && (
                            <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{listing.description}</p>
                        )}
                        <p className="text-white text-sm font-bold mt-1.5">{formatNaira(listing.price)}</p>
                    </div>
                </button>
                <div className={`text-white/30 text-[11px] mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                    {timestamp}
                </div>
            </div>
        </div>
    )
}
