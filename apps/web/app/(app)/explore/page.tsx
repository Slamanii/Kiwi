'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AdBanner } from '@/components/Explore/AdBanner'
import { TrendCard } from '@/components/Explore/TrendCard'
import { TabBar } from '@/components/Explore/TabBar'
import { AgentCard } from '@/components/profile/AgentCard'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { SearchBar } from '@/components/ui/SearchBar'
import { SeekFeedList } from '@/components/seek/SeekFeedList'
import { CreateBidSheet } from '@/components/bid/CreateBidSheet'
import { CreateReseekSheet } from '@/components/seek/CreateReseekSheet'
import { MarketplaceList } from '@/app/(app)/marketplace/marketplacelist'
import { exploreApi } from '@/lib/api/explore'
import { agentApi } from '@/lib/api/agent'
import { seekApi } from '@/lib/api/seek'
import { profileApi } from '@/lib/api/profile'
import type { Seek, User, Profile } from '@/types'

type TrendCategory = 'PROPERTY_TYPE' | 'LOCATION' | 'URGENCY' | 'ROOMS' | 'INFO'

type SearchUser = {
    id: string
    name: string
    profile?: { avatarUrl?: string; verificationStatus?: string }
}

type TrendItem = {
    id: string
    category: TrendCategory
    headline: string
    count: number
    computedAt: string
    seeks: Seek[]
}

type Agent = User & { profile: Profile }

const TREND_PREVIEW_SIZE = 3

type ExploreTab = 'explore' | 'marketplace'

const TABS: { key: ExploreTab; label: string }[] = [
    { key: 'explore',     label: 'Explore'     },
    { key: 'marketplace', label: 'Marketplace' },
]

export default function ExplorePage() {
    const router   = useRouter()
    const { user } = useAuth()

    const isLoggedIn = !!user
    const userRole   = user?.roles?.includes('AGENT') ? 'AGENT' : user?.roles?.[0]

    const [tab,          setTab]          = useState<ExploreTab>('explore')
    const [search,       setSearch]       = useState('')
    const [agents,       setAgents]       = useState<Agent[]>([])
    const [trending,     setTrending]     = useState<TrendItem[]>([])
    const [loading,      setLoading]      = useState(true)
    const [liked,        setLiked]        = useState<Set<string>>(new Set())
    const [bookmarked,   setBookmarked]   = useState<Set<string>>(new Set())
    const [bidSeekId,    setBidSeekId]    = useState<string | null>(null)
    const [reseekSeekId, setReseekSeekId] = useState<string | null>(null)
    const [userResults,  setUserResults]  = useState<SearchUser[]>([])
    const [searching,    setSearching]    = useState(false)

    const requireAuth = useCallback(() => router.push('/login'), [router])

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

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        Promise.all([
            agentApi.getAll({ limit: 10 }),
            exploreApi.getTrending(),
        ])
            .then(([agentsRes, trendingRes]) => {
                if (cancelled) return
                setAgents(agentsRes.data.agents ?? [])
                setTrending(trendingRes.data ?? [])
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [])

    // like/bookmark/reseek/bid require auth — press/comment/share don't
    const gated = (fn: (seekId: string) => void) => (seekId: string) => {
        if (!isLoggedIn) { requireAuth(); return }
        fn(seekId)
    }

    const toggleLike = gated(async (seekId: string) => {
        const was = liked.has(seekId)
        setLiked(prev => { const n = new Set(prev); was ? n.delete(seekId) : n.add(seekId); return n })
        try {
            await seekApi.like(seekId)
        } catch {
            setLiked(prev => { const n = new Set(prev); was ? n.add(seekId) : n.delete(seekId); return n })
        }
    })

    const toggleBookmark = gated(async (seekId: string) => {
        const was = bookmarked.has(seekId)
        setBookmarked(prev => { const n = new Set(prev); was ? n.delete(seekId) : n.add(seekId); return n })
        try {
            await seekApi.bookmark(seekId)
        } catch {
            setBookmarked(prev => { const n = new Set(prev); was ? n.add(seekId) : n.delete(seekId); return n })
        }
    })

    const handleReseek = gated((seekId: string) => setReseekSeekId(seekId))
    const handleBid    = gated((seekId: string) => setBidSeekId(seekId))

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">

            {/* Search */}
            {tab !== 'marketplace' && (
                <div className="pt-4">
                    <SearchBar value={search} onChange={setSearch} />
                </div>
            )}

            {/* Tabs */}
            <div className="mt-4">
                <TabBar tabs={TABS} active={tab} onChange={setTab} />
            </div>

            {tab === 'marketplace' ? (
                <MarketplaceList />
            ) : search.trim() ? (
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
                    {/* Assistant banner */}
                    <div className="mt-4">
                        <AdBanner
                            title="MyAgent Assistants"
                            subtitle="For enquiries, fraud complaints — reach out here"
                            onPress={() => router.push('/communities/cmtcvk2hz003njovscmr7lp2b')}
                        />
                    </div>

                    {/* Trending */}
                    {!loading && trending.length > 0 && (
                        <div className="mt-6">
                            {trending.map(trend => (
                                <TrendCard
                                    key={trend.id}
                                    category={trend.category}
                                    headline={trend.headline}
                                    count={trend.count}
                                    computedAt={trend.computedAt}
                                    seeks={trend.seeks.slice(0, TREND_PREVIEW_SIZE)}
                                    userRole={userRole}
                                    onTrendPress={() => router.push(`/explore/${trend.id}`)}
                                    onSeekPress={seek => router.push(`/seek/${seek.id}`)}
                                    onLike={toggleLike}
                                    onReseek={handleReseek}
                                    onBid={handleBid}
                                    onComment={seekId => router.push(`/seek/${seekId}#comments`)}
                                    onBookmark={toggleBookmark}
                                    likedIds={liked}
                                    bookmarkedIds={bookmarked}
                                />
                            ))}
                        </div>
                    )}

                    {/* Agents rail */}
                    {agents.length > 0 && (
                        <div className="mt-6 px-4 space-y-3">
                            <h2 className="text-sm font-semibold text-white/70">Agents for you</h2>
                            {agents.map(agent => (
                                <AgentCard
                                    key={agent.id}
                                    agent={agent}
                                    onPress={() => router.push(`/container/fullscreen/profile/${agent.id}`)}
                                    onMessage={() => router.push(`/chat/dm/${agent.id}`)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Everything else, unfiltered */}
                    <div className="mt-6">
                        <SeekFeedList onBid={handleBid} onReseek={handleReseek} />
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
