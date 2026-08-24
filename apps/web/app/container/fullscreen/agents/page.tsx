'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/ui/SearchBar'
import { AgentCard } from '@/components/profile/AgentCard'
import { agentApi } from '@/lib/api/agent'
import type { User, Profile } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type Agent = User & { profile: Profile }
type FilterKey = 'zone' | 'rate' | 'rating' | null

const ZONES = ['Lagos', 'Abuja', 'Rivers', 'Ogun', 'Oyo', 'Kano', 'Delta', 'Anambra', 'Enugu', 'Edo']

const RATE_OPTIONS = [
    { label: 'Any rate',  max: undefined as number | undefined },
    { label: 'Under 10%', max: 10 },
    { label: 'Under 15%', max: 15 },
    { label: 'Under 20%', max: 20 },
]

const RATING_OPTIONS = [
    { label: 'Any rating', min: undefined as number | undefined },
    { label: '3+ stars',   min: 3   },
    { label: '4+ stars',   min: 4   },
    { label: '4.5+ stars', min: 4.5 },
]

export default function AgentsPage() {
    const router = useRouter()

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [zone,   setZone]   = useState<string | null>(null)
    const [rate,   setRate]   = useState(RATE_OPTIONS[0])
    const [rating, setRating] = useState(RATING_OPTIONS[0])

    const [openFilter, setOpenFilter] = useState<FilterKey>(null)

    const [agents,      setAgents]      = useState<Agent[]>([])
    const [cursor,      setCursor]      = useState<string | null>(null)
    const [hasMore,     setHasMore]     = useState(true)
    const [loading,     setLoading]     = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const hasFilter = !!zone || rate.max !== undefined || rating.min !== undefined

    // Debounce search input so we don't refetch on every keystroke
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
        return () => clearTimeout(t)
    }, [search])

    const fetchAgents = useCallback(async (cursorParam?: string) => {
        const res = await agentApi.getAll({
            search:    debouncedSearch || undefined,
            location:  zone ?? undefined,
            maxRate:   rate.max,
            minRating: rating.min,
            cursor:    cursorParam,
            limit:     20,
        })
        return res.data
    }, [debouncedSearch, zone, rate, rating])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setAgents([])
        setCursor(null)
        setHasMore(true)

        fetchAgents()
            .then(data => {
                if (cancelled) return
                setAgents(data.agents ?? [])
                setCursor(data.nextCursor ?? null)
                setHasMore(!!data.nextCursor)
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [fetchAgents])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const data = await fetchAgents(cursor)
            setAgents(prev => [...prev, ...(data.agents ?? [])])
            setCursor(data.nextCursor ?? null)
            setHasMore(!!data.nextCursor)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, fetchAgents])

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

    const clearFilters = () => {
        setZone(null)
        setRate(RATE_OPTIONS[0])
        setRating(RATING_OPTIONS[0])
        setOpenFilter(null)
    }

    const FILTER_TITLES: Record<Exclude<FilterKey, null>, string> = {
        zone: 'Zone', rate: 'Rate', rating: 'Rating',
    }

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-12">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-14 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <span className="text-lg font-bold text-white">Agents</span>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholders={['Search agents by username...']}
                />
            </div>

            {/* Filters */}
            <div className="flex items-center justify-center gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
                <button
                    onClick={clearFilters}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${!hasFilter ? 'bg-white text-black' : 'bg-white/5 text-white/50'}`}
                >
                    All
                </button>

                <button
                    onClick={() => setOpenFilter('zone')}
                    className={`shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${zone ? 'text-cyan-400 bg-cyan-400/15 border border-cyan-400/30' : 'bg-white/5 text-white/50'}`}
                >
                    {zone ?? 'Zone'} <span className="text-[10px]">▾</span>
                </button>

                <button
                    onClick={() => setOpenFilter('rate')}
                    className={`shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${rate.max !== undefined ? 'text-cyan-400 bg-cyan-400/15 border border-cyan-400/30' : 'bg-white/5 text-white/50'}`}
                >
                    {rate.max !== undefined ? rate.label : 'Rate'} <span className="text-[10px]">▾</span>
                </button>

                <button
                    onClick={() => setOpenFilter('rating')}
                    className={`shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${rating.min !== undefined ? 'text-cyan-400 bg-cyan-400/15 border border-cyan-400/30' : 'bg-white/5 text-white/50'}`}
                >
                    {rating.min !== undefined ? rating.label : 'Rating'} <span className="text-[10px]">▾</span>
                </button>
            </div>

            {/* Agents list */}
            <div className="px-4 space-y-3">
                {loading ? (
                    [0, 1, 2].map(i => (
                        <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
                    ))
                ) : agents.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-white/25 text-sm">No agents match your search.</p>
                    </div>
                ) : (
                    <>
                        {agents.map(agent => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                onPress={() => router.push(`/container/fullscreen/profile/${agent.id}`)}
                                onMessage={() => router.push(`/chat/dm/${agent.id}`)}
                            />
                        ))}
                        <div ref={sentinelRef} className="h-2" />
                        {loadingMore && <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />}
                    </>
                )}
            </div>

            {/* Filter sheet */}
            <FilterSheet
                open={openFilter !== null}
                title={openFilter ? FILTER_TITLES[openFilter] : ''}
                onClose={() => setOpenFilter(null)}
            >
                {openFilter === 'zone' && ZONES.map(z => (
                    <FilterOption key={z} label={z} active={zone === z}
                        onClick={() => { setZone(z); setOpenFilter(null) }} />
                ))}
                {openFilter === 'rate' && RATE_OPTIONS.map(opt => (
                    <FilterOption key={opt.label} label={opt.label} active={rate.label === opt.label}
                        onClick={() => { setRate(opt); setOpenFilter(null) }} />
                ))}
                {openFilter === 'rating' && RATING_OPTIONS.map(opt => (
                    <FilterOption key={opt.label} label={opt.label} active={rating.label === opt.label}
                        onClick={() => { setRating(opt); setOpenFilter(null) }} />
                ))}
            </FilterSheet>
        </div>
    )
}

function FilterOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                border transition-colors
                ${active
                    ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                    : 'border-white/8 bg-white/4 text-white/70'}`}
        >
            <span className="text-sm font-medium">{label}</span>
            {active && <span className="text-cyan-400 text-base">✓</span>}
        </button>
    )
}

function FilterSheet({ open, title, onClose, children }: {
    open: boolean
    title: string
    onClose: () => void
    children: React.ReactNode
}) {
    return (
        <div className={`fixed inset-0 z-50 flex items-end ${open ? '' : 'pointer-events-none'}`}>
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity
                    ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div
                className={`relative w-full bg-neutral-900 rounded-t-3xl px-4 pt-4 pb-10 z-10
                    max-h-[70vh] overflow-y-auto transition-transform duration-300 ease-out
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <h2 className="text-white font-semibold text-base mb-4">{title}</h2>
                <div className="space-y-2">
                    {children}
                </div>
            </div>
        </div>
    )
}
