'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useFeed } from '@/hooks/useFeed'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { NotificationBell } from '@/components/notification/NotificationBell'
import { SeekCardSkeleton } from '@/components/seek/SeekcardSkeleton'
import { SeekFilter } from '@/components/seek/SeekFilters'
import { WelcomeCard } from '@/components/ui/WelcomeCard'
import { QuickLinkCard } from '@/components/ui/QuickLinkCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { CreateBidSheet } from '@/components/bid/CreateBidSheet'
import { CreateReseekSheet } from '@/components/seek/CreateReseekSheet'
import { seekApi } from '@/lib/api/seek'
import { profileApi } from '@/lib/api/profile'
import { renderSeekCard } from '@/lib/renderSeekCard'
import { applySeekFilters } from '@/lib/filterSeeks'
import type { Seek } from '@/types'
import type { AppliedFilters, FilterKey } from '@/lib/filterconfig'

type SearchUser = {
    id: string
    name: string
    profile?: { avatarUrl?: string; verificationStatus?: string }
}

export default function FeedPage() {
    const router   = useRouter()
    const { user } = useAuth()

    const [search,         setSearch]         = useState('')
    const [liked,          setLiked]          = useState<Set<string>>(new Set())
    const [bookmarked,     setBookmarked]     = useState<Set<string>>(new Set())
    const [bidSeekId,      setBidSeekId]      = useState<string | null>(null)
    const [reseekSeekId,   setReseekSeekId]   = useState<string | null>(null)
    const [appliedFilters, setAppliedFilters] = useLocalStorage<AppliedFilters>('kiwi:filters:feed', {})
    const [userResults,    setUserResults]    = useState<SearchUser[]>([])
    const [searching,      setSearching]      = useState(false)

    const isLoggedIn = !!user
    const userRole   = user?.roles?.includes('AGENT') ? 'AGENT' : user?.roles?.[0]

    const { seeks, loading, loadingMore, hasMore, loadMore } = useFeed({})
    const { count: unreadCount } = useUnreadCount()

    // ── User search ──────────────────────────────────────────────────────────
    useEffect(() => {
        const q = search.trim()
        if (!q) { setUserResults([]); setSearching(false); return }
        setSearching(true)
        let cancelled = false
        const timeout = setTimeout(() => {
            profileApi.searchUsers(q)
                .then(res => { if (!cancelled) setUserResults(res.data ?? []) })
                .catch(console.error)
                .finally(() => { if (!cancelled) setSearching(false) })
        }, 300)
        return () => { cancelled = true; clearTimeout(timeout) }
    }, [search])

    // ── Infinite scroll ───────────────────────────────────────────────────────
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

    // ── Like ──────────────────────────────────────────────────────────────────
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

    // ── Bookmark ──────────────────────────────────────────────────────────────
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

    // ── Reseek ────────────────────────────────────────────────────────────────
    const handleReseek = (seek: Seek) => {
        if (!isLoggedIn) { requireAuth(); return }
        setReseekSeekId(seek.id)
    }

    // ── Bid ───────────────────────────────────────────────────────────────────
    const handleBid = (seek: Seek) => {
        if (!isLoggedIn) { requireAuth(); return }
        setBidSeekId(seek.id)
    }

    // ── Share ─────────────────────────────────────────────────────────────────
    const handleShare = (seek: Seek) => {
        navigator.share?.({ title: 'Kiwi', url: `${window.location.origin}/seek/${seek.id}` })
    }

    // ── Filters ───────────────────────────────────────────────────────────────
    const handleFilterChange = (key: FilterKey, value: AppliedFilters[FilterKey]) => {
        setAppliedFilters(prev => ({ ...prev, [key]: value }))
    }

    const visibleSeeks = applySeekFilters(seeks, appliedFilters)

    // ── Card renderer ─────────────────────────────────────────────────────────
    const renderCard = (seek: Seek) => renderSeekCard(seek, {
        userRole,
        isLoggedIn,
        requireAuth,
        isLiked:      id => liked.has(id),
        isBookmarked: id => bookmarked.has(id),
        onLike:       s => toggleLike(s),
        onComment:    s => router.push(`/seek/${s.id}#comments`),
        onBookmark:   s => toggleBookmark(s),
        onReseek:     s => handleReseek(s),
        onBid:        s => handleBid(s),
        onShare:      s => handleShare(s),
        onPress:      s => router.push(`/seek/${s.id}`),
        onOriginalPress: o => router.push(`/seek/${o.id}`),
    })

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">

            {/* Header */}
            <div className="flex items-center justify-end gap-2 px-4 pt-1 pb-3">
                <button className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70">
                    <span className="text-base">☀️</span>
                </button>
                <NotificationBell
                    unreadCount={unreadCount}
                    onClick={() => {
                        if (!isLoggedIn) { requireAuth(); return }
                        router.push('/profile/notifications')
                    }}
                />
            </div>

            {/* Search */}
            <SearchBar
                value={search}
                onChange={v => { if (!isLoggedIn) { requireAuth(); return } setSearch(v) }}
                onFocus={() => { if (!isLoggedIn) requireAuth() }}
            />

            {search.trim() ? (
                /* Search results */
                <div className="mt-6 px-4 space-y-2">
                    {searching ? (
                        <p className="text-white/30 text-sm text-center py-8">Searching...</p>
                    ) : userResults.length === 0 ? (
                        <p className="text-white/30 text-sm text-center py-8">No users found.</p>
                    ) : (
                        userResults.map(u => (
                            <button
                                key={u.id}
                                onClick={() => router.push(`/container/fullscreen/profile/${u.id}`)}
                                className="w-full flex items-center gap-3 bg-[#1c1c1e] rounded-2xl p-3 active:opacity-70"
                            >
                                <Avatar src={u.profile?.avatarUrl} name={u.name} size="sm" />
                                <span className="text-sm font-semibold text-white">{u.name}</span>
                                {u.profile?.verificationStatus === 'VERIFIED' && (
                                    <VerifiedBadge size="xs" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            ) : (
                <>
                    {/* Welcome card — guests only */}
                    {!isLoggedIn && (
                        <div className="mt-4">
                            <WelcomeCard
                                title="Let's get you hooked up"
                                subtitle="Find the right agent, get the best prices and quality."
                                onPress={() => router.push('/register')}
                            />
                        </div>
                    )}

                    {/* Quick links */}
                    <div className="flex justify-center gap-3 px-4 mt-4">
                        <QuickLinkCard
                            title="Agents"
                            subtitle="Find the right match for you"
                            bg="bg-emerald-500"
                            icon="🏠"
                            onPress={() => { if (!isLoggedIn) { requireAuth(); return } router.push('/container/fullscreen/agents') }}
                        />
                        <QuickLinkCard
                            title="Communities"
                            subtitle="See what others are talking about"
                            bg="bg-purple-500"
                            icon="👥"
                            onPress={() => router.push('/communities')}
                        />
                    </div>

                    {/* Filters */}
                    <div className="mt-8">
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
                        ) : seeks.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-white/25 text-sm">No seeks yet. Be the first to post.</p>
                            </div>
                        ) : visibleSeeks.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-white/25 text-sm">No seeks match your filters.</p>
                            </div>
                        ) : (
                            <>
                                {visibleSeeks.map(renderCard)}
                                <div ref={sentinelRef} className="h-2" />
                                {loadingMore && <SeekCardSkeleton />}
                            </>
                        )}
                    </div>
                </>
            )}

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