'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useFeed } from '@/hooks/useFeed'
import { SeekCardSkeleton } from '@/components/seek/SeekcardSkeleton'
import { CreateBidSheet } from '@/components/bid/CreateBidSheet'
import { CreateReseekSheet } from '@/components/seek/CreateReseekSheet'
import { seekApi } from '@/lib/api/seek'
import { renderSeekCard } from '@/lib/renderSeekCard'
import type { Seek } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

export default function RequestsPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuth()

    const [liked,        setLiked]        = useState<Set<string>>(new Set())
    const [bookmarked,   setBookmarked]   = useState<Set<string>>(new Set())
    const [bidSeekId,    setBidSeekId]    = useState<string | null>(null)
    const [reseekSeekId, setReseekSeekId] = useState<string | null>(null)

    const isLoggedIn = !!user
    const userRole   = user?.roles?.includes('AGENT') ? 'AGENT' : user?.roles?.[0]

    const { seeks, loading, loadingMore, hasMore, loadMore } = useFeed({
        filters: { authorId: params.id },
    })

    const sentinelRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore() },
            { threshold: 0.1 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [hasMore, loadingMore, loadMore])

    const requireAuth = useCallback(() => router.push('/login'), [router])

    const toggleLike = async (seek: Seek) => {
        if (!isLoggedIn) { requireAuth(); return }
        const was = liked.has(seek.id)
        setLiked(prev => { const n = new Set(prev); was ? n.delete(seek.id) : n.add(seek.id); return n })
        try {
            await seekApi.like(seek.id)
        } catch {
            setLiked(prev => { const n = new Set(prev); was ? n.add(seek.id) : n.delete(seek.id); return n })
        }
    }

    const toggleBookmark = async (seek: Seek) => {
        if (!isLoggedIn) { requireAuth(); return }
        const was = bookmarked.has(seek.id)
        setBookmarked(prev => { const n = new Set(prev); was ? n.delete(seek.id) : n.add(seek.id); return n })
        try {
            await seekApi.bookmark(seek.id)
        } catch {
            setBookmarked(prev => { const n = new Set(prev); was ? n.add(seek.id) : n.delete(seek.id); return n })
        }
    }

    const renderCard = (seek: Seek) => renderSeekCard(seek, {
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
    })

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">
            <div className="flex items-center gap-3 px-4 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-lg font-semibold">Requests</h1>
            </div>

            <div className="px-8 space-y-3">
                {loading ? (
                    [0, 1, 2].map(i => <SeekCardSkeleton key={i} />)
                ) : seeks.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-white/25 text-sm">No requests yet.</p>
                    </div>
                ) : (
                    <>
                        {seeks.map(renderCard)}
                        <div ref={sentinelRef} className="h-2" />
                        {loadingMore && <SeekCardSkeleton />}
                    </>
                )}
            </div>

            {bidSeekId && (
                <CreateBidSheet
                    seekId={bidSeekId}
                    onClose={() => setBidSeekId(null)}
                    onSuccess={() => setBidSeekId(null)}
                />
            )}

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
