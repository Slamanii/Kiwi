'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/filterconfig'
import { isVideoUrl, conditionLabel } from '@/lib/marketplaceConfig'
import { listingApi } from '@/lib/api/listing'
import { orderApi } from '@/lib/api/order'
import type { Listing } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'
import { MediaViewport } from '@/components/ui/MediaViewport'

export default function ListingDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [listing, setListing] = useState<Listing | null>(null)
    const [loading, setLoading] = useState(true)
    const [favorited, setFavorited] = useState(false)
    const [ordering, setOrdering] = useState(false)
    const [ordered, setOrdered] = useState(false)
    const [viewerOpen, setViewerOpen] = useState(false)

    useEffect(() => {
        listingApi.getById(id)
            .then(res => {
                setListing(res.data)
                setFavorited(!!res.data.favorited)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    async function toggleFavorite() {
        if (!listing) return
        const next = !favorited
        setFavorited(next)
        try {
            if (next) await listingApi.favorite(listing.id)
            else await listingApi.unfavorite(listing.id)
        } catch (err) {
            setFavorited(!next)
            console.error(err)
        }
    }

    async function placeOrder() {
        if (!listing || ordering || ordered) return
        setOrdering(true)
        try {
            await orderApi.create(listing.communityId, [{ listingId: listing.id, quantity: 1 }])
            setOrdered(true)
        } catch (err) {
            console.error(err)
        } finally {
            setOrdering(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center text-white/30 text-sm">
                Loading…
            </div>
        )
    }

    if (!listing) {
        return (
            <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
                <h1 className="text-lg font-semibold text-white">Listing not found</h1>
                <p className="mt-1 text-sm text-white/40">It may have been removed.</p>
            </div>
        )
    }

    const cover = listing.images[0]
    const coverIsVideo = !!cover && isVideoUrl(cover)
    const media = listing.images.map(url => ({ type: isVideoUrl(url) ? 'video' as const : 'image' as const, url }))

    return (
        <div className="min-h-full pb-10">
            <div className="flex items-center gap-3 px-4 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
            </div>

            {cover && (
                <button
                    onClick={() => setViewerOpen(true)}
                    className="w-full px-5 pt-4 pb-4 flex justify-center text-left"
                >
                    {coverIsVideo ? (
                        <video src={cover} className="max-h-80 w-full object-contain rounded-2xl" muted playsInline controls />
                    ) : (
                        <img src={cover} alt={listing.title} className="max-h-80 w-full object-contain rounded-2xl" />
                    )}
                </button>
            )}

            {viewerOpen && (
                <MediaViewport items={media} initialIndex={0} onClose={() => setViewerOpen(false)} />
            )}

            <div className="px-5">
                {listing.community?.name && (
                    <p className="text-xs text-white/50 font-medium">{listing.community.name}</p>
                )}
                <p className="text-xl font-bold text-white leading-snug mt-1">{listing.title}</p>
                <p className="text-xl font-bold text-white mt-1">{formatNaira(listing.price)}</p>

                <div className="flex items-center gap-2 mt-3">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/8 text-white/70">
                        {conditionLabel(listing.condition)}
                    </span>
                    {listing.location && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400">
                            {listing.location}
                        </span>
                    )}
                </div>

                {listing.description && (
                    <p className="mt-4 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                        {listing.description}
                    </p>
                )}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={toggleFavorite}
                        className={`flex-1 py-3 rounded-full text-sm font-semibold transition-colors
                            ${favorited ? 'bg-white/10 text-white' : 'bg-white text-black'}`}
                    >
                        {favorited ? 'Favorited' : 'Favorite'}
                    </button>
                    <button
                        onClick={placeOrder}
                        disabled={ordering || ordered}
                        className="flex-1 py-3 rounded-full border border-white text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {ordered ? 'Ordered' : ordering ? 'Ordering…' : 'Order'}
                    </button>
                </div>
            </div>
        </div>
    )
}
