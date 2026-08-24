'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { communityApi } from '@/lib/api/community'
import { listingApi } from '@/lib/api/listing'
import { formatNaira } from '@/lib/filterconfig'
import { isVideoUrl, conditionLabel } from '@/lib/marketplaceConfig'
import type { Community, Listing } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

const STATUS_LABEL: Record<Listing['status'], string> = {
    ACTIVE: 'Active',
    SOLD: 'Sold',
    SOLD_OUT: 'Sold out',
    CLOSED: 'Closed',
    REMOVED: 'Removed',
}

export default function CommunityListingsPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()

    const [community, setCommunity] = useState<Community | null>(null)
    const [listings, setListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<string | null>(null)

    useEffect(() => {
        communityApi.getById(id).then(res => setCommunity(res.data)).catch(console.error)
    }, [id])

    useEffect(() => {
        setLoading(true)
        listingApi.browse({ scope: id, limit: 100 })
            .then(res => setListings(res.data.listings))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    async function handleSoldOut(listingId: string) {
        if (busyId) return
        setBusyId(listingId)
        try {
            const res = await listingApi.setSoldOut(listingId)
            setListings(prev => prev.map(l => l.id === listingId ? res.data : l))
        } catch (err) {
            console.error(err)
        } finally {
            setBusyId(null)
        }
    }

    async function handleDelist(listingId: string) {
        if (busyId || !confirm('Delist this listing?')) return
        setBusyId(listingId)
        try {
            const res = await listingApi.delist(listingId)
            setListings(prev => prev.map(l => l.id === listingId ? res.data : l))
        } catch (err) {
            console.error(err)
        } finally {
            setBusyId(null)
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
                    <h1 className="text-sm font-semibold text-white">Listings</h1>
                    {community && <p className="text-xs text-white/40 truncate">{community.name}</p>}
                </div>
                <button
                    onClick={() => router.push(`/marketplace/create?storeId=${id}`)}
                    className="ml-auto text-xs font-semibold text-black bg-cyan-400 px-3 py-1.5 rounded-full"
                >
                    + Add
                </button>
            </div>

            <div className="px-4 mt-2 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-white/30 text-sm">Loading…</div>
                ) : listings.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-white/30 text-sm">No listings yet.</div>
                ) : (
                    listings.map(listing => {
                        const cover = listing.images[0]
                        const coverIsVideo = !!cover && isVideoUrl(cover)
                        const isActive = listing.status === 'ACTIVE'

                        return (
                            <div key={listing.id} className="bg-[#1c1c1e] rounded-2xl p-3 flex gap-3 items-start">
                                <div
                                    onClick={() => router.push(`/listings/${listing.id}`)}
                                    className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0 cursor-pointer"
                                >
                                    {cover && (coverIsVideo ? (
                                        <video src={cover} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                    ) : (
                                        <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
                                    ))}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white truncate">{listing.title}</span>
                                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                            ${isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/8 text-white/40'}`}>
                                            {STATUS_LABEL[listing.status]}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/40 mt-0.5">
                                        {formatNaira(listing.price)} · {conditionLabel(listing.condition)} · Stock {listing.stock}
                                    </p>

                                    {listing.status !== 'REMOVED' && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => router.push(`/marketplace/create?listingId=${listing.id}`)}
                                                className="text-[11px] font-medium text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full"
                                            >
                                                Edit
                                            </button>
                                            {isActive && (
                                                <button
                                                    onClick={() => handleSoldOut(listing.id)}
                                                    disabled={busyId === listing.id}
                                                    className="text-[11px] font-medium text-white/60 border border-white/10 px-2.5 py-1 rounded-full disabled:opacity-40"
                                                >
                                                    Mark sold out
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelist(listing.id)}
                                                disabled={busyId === listing.id}
                                                className="text-[11px] font-medium text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full disabled:opacity-40"
                                            >
                                                Delist
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
