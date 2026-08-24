'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SeekFilter } from '@/components/seek/SeekFilters'
import { SeekCardSkeleton } from '@/components/seek/SeekcardSkeleton'
import { CreateBidSheet } from '@/components/bid/CreateBidSheet'
import { CreateReseekSheet } from '@/components/seek/CreateReseekSheet'
import { exploreApi } from '@/lib/api/explore'
import { seekApi } from '@/lib/api/seek'
import { renderSeekCard } from '@/lib/renderSeekCard'
import { applySeekFilters } from '@/lib/filterSeeks'
import type { Seek } from '@/types'
import type { AppliedFilters, FilterKey } from '@/lib/filterconfig'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type TrendCategory = 'PROPERTY_TYPE' | 'LOCATION' | 'URGENCY' | 'ROOMS' | 'INFO'

type TrendItem = {
    id: string
    category: TrendCategory
    headline: string
    count: number
    computedAt: string
    seeks: Seek[]
}

export default function TrendDetailPage() {
    const { trendId } = useParams<{ trendId: string }>()
    const router       = useRouter()
    const { user }     = useAuth()

    const isLoggedIn = !!user
    const userRole   = user?.roles?.includes('AGENT') ? 'AGENT' : user?.roles?.[0]

    const [trend,          setTrend]          = useState<TrendItem | null>(null)
    const [loading,        setLoading]        = useState(true)
    const [liked,          setLiked]          = useState<Set<string>>(new Set())
    const [bookmarked,     setBookmarked]     = useState<Set<string>>(new Set())
    const [bidSeekId,      setBidSeekId]      = useState<string | null>(null)
    const [reseekSeekId,   setReseekSeekId]   = useState<string | null>(null)
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({})

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        exploreApi.getTrending()
            .then(res => {
                if (cancelled) return
                const found = (res.data ?? []).find((t: TrendItem) => t.id === trendId) ?? null
                setTrend(found)
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [trendId])

    const requireAuth = useCallback(() => router.push('/login'), [router])

    const toggleLike = async (seek: Seek) => {
        const was = liked.has(seek.id)
        setLiked(prev => { const n = new Set(prev); was ? n.delete(seek.id) : n.add(seek.id); return n })
        try {
            await seekApi.like(seek.id)
        } catch {
            setLiked(prev => { const n = new Set(prev); was ? n.add(seek.id) : n.delete(seek.id); return n })
        }
    }

    const toggleBookmark = async (seek: Seek) => {
        const was = bookmarked.has(seek.id)
        setBookmarked(prev => { const n = new Set(prev); was ? n.delete(seek.id) : n.add(seek.id); return n })
        try {
            await seekApi.bookmark(seek.id)
        } catch {
            setBookmarked(prev => { const n = new Set(prev); was ? n.add(seek.id) : n.delete(seek.id); return n })
        }
    }

    const handleFilterChange = (key: FilterKey, value: AppliedFilters[FilterKey]) => {
        setAppliedFilters(prev => ({ ...prev, [key]: value }))
    }

    const visibleSeeks = trend ? applySeekFilters(trend.seeks, appliedFilters) : []

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <button onClick={() => router.back()} className="text-white/60" aria-label="Back">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{trend?.headline ?? 'Trend'}</p>
                    {trend && <p className="text-xs text-gray-500">{trend.count} post{trend.count !== 1 ? 's' : ''}</p>}
                </div>
            </div>

            {/* Filters */}
            <div className="mt-2">
                <SeekFilter
                    applied={appliedFilters}
                    onFilterChange={handleFilterChange}
                    onClearAll={() => setAppliedFilters({})}
                />
            </div>

            {/* Feed */}
            <div className="px-8 mt-3 space-y-3">
                {loading ? (
                    [0, 1, 2].map(i => <SeekCardSkeleton key={i} />)
                ) : !trend ? (
                    <div className="text-center py-20">
                        <p className="text-white/25 text-sm">This trend is no longer available.</p>
                    </div>
                ) : visibleSeeks.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-white/25 text-sm">No seeks match your filters.</p>
                    </div>
                ) : (
                    visibleSeeks.map(seek => renderSeekCard(seek, {
                        userRole,
                        isLoggedIn,
                        requireAuth,
                        isLiked:      id => liked.has(id),
                        isBookmarked: id => bookmarked.has(id),
                        onLike:       s => toggleLike(s),
                        onComment:    s => router.push(`/seek/${s.id}#comments`),
                        onBookmark:   s => toggleBookmark(s),
                        onReseek:     s => setReseekSeekId(s.id),
                        onBid:        s => setBidSeekId(s.id),
                        onShare:      s => navigator.share?.({ title: 'Kiwi', url: `${window.location.origin}/seek/${s.id}` }),
                        onPress:      s => router.push(`/seek/${s.id}`),
                        onOriginalPress: o => router.push(`/seek/${o.id}`),
                    }))
                )}
            </div>

            {/* Bid sheet */}
            {bidSeekId && (
                <CreateBidSheet
                    seekId={bidSeekId}
                    onClose={() => setBidSeekId(null)}
                    onSuccess={() => setBidSeekId(null)}
                />
            )}

            {/* Reseek sheet */}
            {reseekSeekId && (
                <CreateReseekSheet
                    seekId={reseekSeekId}
                    onClose={() => setReseekSeekId(null)}
                    onSuccess={() => setReseekSeekId(null)}
                />
            )}
        </div>
    )
}
