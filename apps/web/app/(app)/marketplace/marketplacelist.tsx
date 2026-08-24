// web/components/marketplace/MarketplaceList.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { listingApi } from '@/lib/api/listing'
import { SearchBar } from '@/components/ui/SearchBar'
import { BrowseFilterBar, type BrowseFilterKey } from '@/components/community/BrowseFilterBar'
import { BrowseFilterModal } from '@/components/community/BrowseFilterModal'
import { ListingCard } from '@/components/community/ListingCard'
import type { Listing, ListingCategory, ListingCondition } from '@/types'

export function MarketplaceList() {
    const router = useRouter()
    const { user } = useAuth()

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [scope, setScope] = useState('ALL')
    const [scopeLabel, setScopeLabel] = useState('All')
    const [category, setCategory] = useState<ListingCategory | null>(null)
    const [categoryLabel, setCategoryLabel] = useState('Category')
    const [condition, setCondition] = useState<ListingCondition | null>(null)
    const [conditionLabel, setConditionLabel] = useState('Condition')
    const [location, setLocation] = useState<string | null>(null)
    const [locationLabel, setLocationLabel] = useState('Location')
    const [filterKey, setFilterKey] = useState<BrowseFilterKey | null>(null)

    const [listings, setListings] = useState<Listing[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300)
        return () => clearTimeout(timeout)
    }, [search])

    const fetchPage = useCallback((cursorArg?: string) =>
        listingApi.browse({
            scope,
            category: category ?? undefined,
            condition: condition ?? undefined,
            location: location ?? undefined,
            q: debouncedSearch || undefined,
            cursor: cursorArg,
        }), [scope, category, condition, location, debouncedSearch])

    useEffect(() => {
        setLoading(true)
        fetchPage()
            .then(res => {
                setListings(res.data.listings)
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [fetchPage])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await fetchPage(cursor)
            setListings(prev => [...prev, ...res.data.listings])
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

    return (
        <div className="min-h-full">
            <div className="px-4 mt-4 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                    <SearchBar value={search} onChange={setSearch} placeholders={['Search listings']} fullWidth />
                </div>
                <Link
                    href="/favorites"
                    className="w-11 h-11 shrink-0 rounded-full bg-transparent border border-cyan-500 flex items-center justify-center active:opacity-70"
                    aria-label="Favorite listings"
                >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                </Link>
            </div>

            <div className="mt-3">
                <BrowseFilterBar
                    mode="MARKETPLACE"
                    scopeLabel={scopeLabel}
                    categoryLabel={categoryLabel}
                    conditionLabel={conditionLabel}
                    locationLabel={locationLabel}
                    scopeIsDefault={scope === 'ALL'}
                    categoryIsDefault={category === null}
                    conditionIsDefault={condition === null}
                    locationIsDefault={location === null}
                    onPillClick={setFilterKey}
                />
            </div>

            {!user || loading ? (
                <div className="flex items-center justify-center py-20 text-white/30 text-sm">
                    Loading…
                </div>
            ) : listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <h1 className="text-lg font-semibold text-white">No listings found</h1>
                    <p className="mt-1 text-sm text-white/40">Try a different filter.</p>
                </div>
            ) : (
                <div className="px-4 mt-7 columns-2 gap-3">
                    {listings.map(listing => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            onClick={() => router.push(`/listings/${listing.id}`)}
                        />
                    ))}
                    <div ref={sentinelRef} className="h-4" />
                </div>
            )}

            <BrowseFilterModal
                open={filterKey !== null}
                filterKey={filterKey}
                mode="MARKETPLACE"
                scope={scope}
                category={category}
                condition={condition}
                location={location}
                onApplyScope={(v, l) => { setScope(v); setScopeLabel(l) }}
                onApplyCategory={(v, l) => { setCategory(v as ListingCategory | null); setCategoryLabel(l) }}
                onApplyCondition={(v, l) => { setCondition(v as ListingCondition | null); setConditionLabel(l) }}
                onApplyLocation={(v, l) => { setLocation(v); setLocationLabel(l) }}
                onClose={() => setFilterKey(null)}
            />
        </div>
    )
}