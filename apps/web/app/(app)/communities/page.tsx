'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { communityApi } from '@/lib/api/community'
import { SearchBar } from '@/components/ui/SearchBar'
import CommunityCard, { type CommunityJoinStatus } from '@/components/community/CommunityCard'
import { CreateCommunityModal } from '@/components/community/CreateCommunityModal'
import type { Community, CommunityType } from '@/types'
import { MarketplaceList } from '../marketplace/marketplacelist'

type Tab = 'all' | 'my' | 'archived'

const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'my', label: 'My' },
    { key: 'archived', label: 'Archived' },
]

export default function CommunitiesPage() {
    const router = useRouter()
    const { user } = useAuth()

    const [tab, setTab] = useState<Tab>('all')
    const [type, setType] = useState<CommunityType>('STANDARD')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    const [communities, setCommunities] = useState<Community[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set())
    const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())
    const [showCreate, setShowCreate] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300)
        return () => clearTimeout(timeout)
    }, [search])

    const fetchPage = useCallback((cursorArg?: string) => {
        if (tab === 'my') return communityApi.getMy(cursorArg)
        if (debouncedSearch) return communityApi.search(debouncedSearch, cursorArg)
        return communityApi.getAll(cursorArg)
    }, [tab, debouncedSearch])

    useEffect(() => {
        if (type === 'MARKETPLACE') return
        if (tab === 'archived') { setCommunities([]); setLoading(false); setHasMore(false); return }
        setLoading(true)
        fetchPage()
            .then(res => {
                setCommunities(res.data.communities)
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [tab, type, fetchPage])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await fetchPage(cursor)
            setCommunities(prev => [...prev, ...res.data.communities])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, fetchPage])

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

    async function handleJoin(community: Community) {
        if (joiningIds.has(community.id)) return
        setJoiningIds(prev => new Set(prev).add(community.id))
        try {
            const res = await communityApi.join(community.id)
            if (res.data.status === 'JOINED') {
                setCommunities(prev => prev.map(c => c.id === community.id
                    ? { ...c, isMember: true, currentUserRole: 'MEMBER', memberCount: c.memberCount + 1 }
                    : c))
            } else {
                setRequestedIds(prev => new Set(prev).add(community.id))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setJoiningIds(prev => { const n = new Set(prev); n.delete(community.id); return n })
        }
    }

    function joinStatus(community: Community): CommunityJoinStatus {
        if (community.isMember) return 'JOINED'
        if (requestedIds.has(community.id)) return 'REQUESTED'
        return 'NONE'
    }

    const rows = communities

    return (
        <div className="min-h-full">
            <div className="px-4 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-white text-[28px] font-bold leading-tight">Communities</h1>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-11 h-11 rounded-full bg-cyan-500 flex items-center justify-center active:opacity-70"
                        aria-label="Create"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 4v16M4 12h16" />
                        </svg>
                    </button>
                </div>

                {type === 'STANDARD' && (
                    <SearchBar value={search} onChange={setSearch} placeholders={['Search communities']} fullWidth />
                )}
            </div>

            <div className="relative flex items-center gap-1 mx-4 mt-4 bg-white/5 rounded-full p-1">
                {(['STANDARD', 'MARKETPLACE'] as CommunityType[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`relative flex-1 text-center text-xs font-medium py-1.5 rounded-full transition-colors
                            ${type === t ? 'bg-cyan-400 text-black' : 'text-white/50'}`}
                    >
                        {t === 'STANDARD' ? 'Groups' : 'Marketplace'}
                   
                    </button>
                    
                ))}
            </div>

            {type === 'MARKETPLACE' ? (
                <MarketplaceList/>
            ) : (
                <>
                    <div className="flex items-center justify-center gap-2 px-4 pt-3 pb-1">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
                                    ${tab === t.key ? 'bg-white text-black' : 'bg-white/5 text-white/50'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'archived' ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <span className="text-4xl mb-3">🗄️</span>
                            <h1 className="text-lg font-semibold text-white">Archived</h1>
                            <p className="mt-1 text-sm text-white/40">Coming soon.</p>
                        </div>
                    ) : !user || loading ? (
                        <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                            Loading…
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <span className="text-4xl mb-3">👥</span>
                            <h1 className="text-lg font-semibold text-white">No communities yet</h1>
                            <p className="mt-1 text-sm text-white/40">
                                {tab === 'my' ? "Communities you join will show up here." : 'Be the first to start one.'}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-2">
                            {rows.map(community => (
                                <CommunityCard
                                    key={community.id}
                                    community={community}
                                    joinStatus={joinStatus(community)}
                                    joining={joiningIds.has(community.id)}
                                    onJoin={() => handleJoin(community)}
                                />
                            ))}
                            <div ref={sentinelRef} className="h-4" />
                        </div>
                    )}
                </>
            )}

            {showCreate && (
                <CreateCommunityModal
                    type={type}
                    onClose={() => setShowCreate(false)}
                    onCreated={community => {
                        setCommunities(prev => [{ ...community, currentUserRole: 'ADMIN', isMember: true }, ...prev])
                        router.push(`/communities/${community.id}`)
                    }}
                />
            )}
        </div>
    )
}
