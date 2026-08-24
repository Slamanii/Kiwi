'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useFeed } from '@/hooks/useFeed'
import { SeekCardSkeleton } from '@/components/seek/SeekcardSkeleton'
import { seekApi } from '@/lib/api/seek'
import { renderSeekCard } from '@/lib/renderSeekCard'
import type { Seek } from '@/types'

type SeekFeedListProps = {
    onBid:    (seekId: string) => void
    onReseek: (seekId: string) => void
}

export function SeekFeedList({ onBid, onReseek }: SeekFeedListProps) {
    const router   = useRouter()
    const { user } = useAuth()

    const isLoggedIn = !!user
    const userRole   = user?.roles?.includes('AGENT') ? 'AGENT' : user?.roles?.[0]

    const [liked,      setLiked]      = useState<Set<string>>(new Set())
    const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

    const { seeks, loading, loadingMore, hasMore, loadMore } = useFeed({})

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

    // renderSeekCard already gates these behind requireAuth, so they only ever run when logged in
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

    if (loading) {
        return (
            <div className="px-8 space-y-3">
                {[0, 1, 2].map(i => <SeekCardSkeleton key={i} />)}
            </div>
        )
    }

    if (seeks.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-white/25 text-sm">No seeks yet. Be the first to post.</p>
            </div>
        )
    }

    return (
        <div className="px-8 space-y-3">
            {seeks.map(seek => renderSeekCard(seek, {
                userRole,
                isLoggedIn,
                requireAuth,
                isLiked:      id => liked.has(id),
                isBookmarked: id => bookmarked.has(id),
                onLike:       s => toggleLike(s),
                onComment:    s => router.push(`/seek/${s.id}#comments`),
                onBookmark:   s => toggleBookmark(s),
                onReseek:     s => onReseek(s.id),
                onBid:        s => onBid(s.id),
                onShare:      s => navigator.share?.({ title: 'Kiwi', url: `${window.location.origin}/seek/${s.id}` }),
                onPress:      s => router.push(`/seek/${s.id}`),
                onOriginalPress: o => router.push(`/seek/${o.id}`),
            }))}
            <div ref={sentinelRef} className="h-2" />
            {loadingMore && <SeekCardSkeleton />}
        </div>
    )
}
