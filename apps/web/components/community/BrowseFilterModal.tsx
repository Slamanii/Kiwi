'use client'

import { useEffect, useState } from 'react'
import { communityApi } from '@/lib/api/community'
import { listingApi } from '@/lib/api/listing'
import { LISTING_CATEGORIES, LISTING_CONDITIONS, COMMUNITY_CATEGORIES } from '@/lib/marketplaceConfig'
import { LocationPickerContent } from '@/components/shared/LocationPicker'
import type { Community } from '@/types'
import type { BrowseFilterKey } from './BrowseFilterBar'
import { ChevronLeftIcon } from '@/components/ui/Icons'

const TITLES: Record<BrowseFilterKey, string> = {
    scope:     'Show',
    category:  'Category',
    condition: 'Condition',
    location:  'Location',
}

type Props = {
    open:      boolean
    filterKey: BrowseFilterKey | null
    mode:      'GROUP' | 'MARKETPLACE'
    scope:     string
    category:  string | null
    condition: string | null
    location:  string | null
    onApplyScope:     (value: string, label: string) => void
    onApplyCategory:  (value: string | null, label: string) => void
    onApplyCondition: (value: string | null, label: string) => void
    onApplyLocation:  (value: string | null, label: string) => void
    onClose: () => void
}

export function BrowseFilterModal({
    open, filterKey, mode, scope, category, condition, location,
    onApplyScope, onApplyCategory, onApplyCondition, onApplyLocation, onClose,
}: Props) {
    return (
        <div className={`fixed inset-0 z-[100] flex flex-col bg-neutral-950
            transition-transform duration-300 ease-out will-change-transform
            ${open ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
        >
            <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-white/5 flex-shrink-0">
                <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center
                        active:opacity-70 transition-opacity text-white"
                    aria-label="Close"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-base font-semibold text-white">
                    {filterKey ? TITLES[filterKey] : ''}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
                {filterKey === 'scope' && (
                    <ScopeContent
                        mode={mode}
                        current={scope}
                        onApply={(v, l) => { onApplyScope(v, l); onClose() }}
                    />
                )}
                {filterKey === 'category' && (
                    <CategoryContent
                        mode={mode}
                        scope={scope}
                        current={category}
                        onApply={(v, l) => { onApplyCategory(v, l); onClose() }}
                    />
                )}
                {filterKey === 'condition' && (
                    <ConditionContent
                        current={condition}
                        onApply={(v, l) => { onApplyCondition(v, l); onClose() }}
                    />
                )}
                {filterKey === 'location' && (
                    <LocationPickerContent
                        current={location}
                        onApply={(v, l) => { onApplyLocation(v, l); onClose() }}
                    />
                )}
            </div>
        </div>
    )
}

// ─── Scope: All / Joined / a specific store (Marketplace only) ─
function ScopeContent({ mode, current, onApply }: {
    mode: 'GROUP' | 'MARKETPLACE'
    current: string
    onApply: (value: string, label: string) => void
}) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Community[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (mode !== 'MARKETPLACE' || query.trim().length === 0) {
            setResults([])
            return
        }
        setLoading(true)
        const timeout = setTimeout(() => {
            communityApi.search(query.trim(), undefined, 'MARKETPLACE')
                .then(res => setResults(res.data.communities))
                .finally(() => setLoading(false))
        }, 300)
        return () => clearTimeout(timeout)
    }, [query, mode])

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                {[{ value: 'ALL', label: 'All' }, { value: 'JOINED', label: 'Joined' }].map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onApply(opt.value, opt.label)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                            border transition-colors
                            ${current === opt.value
                                ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                                : 'border-white/8 bg-white/4 text-white/60'}`}
                    >
                        <span className="text-sm font-medium">{opt.label}</span>
                        {current === opt.value && <span className="text-cyan-400 text-base">✓</span>}
                    </button>
                ))}
            </div>

            {mode === 'MARKETPLACE' && (
                <div>
                    <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-3">
                        Or pick a store
                    </p>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search stores by name"
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/8
                            text-sm text-white placeholder:text-white/30 outline-none
                            focus:border-cyan-400/40"
                    />
                    <div className="mt-3 space-y-2">
                        {loading && <p className="text-xs text-white/30 px-1">Searching…</p>}
                        {!loading && query.trim().length > 0 && results.length === 0 && (
                            <p className="text-xs text-white/30 px-1">No stores found</p>
                        )}
                        {results.map(store => (
                            <button
                                key={store.id}
                                onClick={() => onApply(store.id, store.name)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                                    border transition-colors
                                    ${current === store.id
                                        ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                                        : 'border-white/8 bg-white/4 text-white/60'}`}
                            >
                                <span className="text-sm font-medium truncate">{store.name}</span>
                                {current === store.id && <span className="text-cyan-400 text-base shrink-0">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Category: ListingCategory (Marketplace) or CommunityCategory (Group) ─
function CategoryContent({ mode, scope, current, onApply }: {
    mode: 'GROUP' | 'MARKETPLACE'
    scope: string
    current: string | null
    onApply: (value: string | null, label: string) => void
}) {
    const [counts, setCounts] = useState<Record<string, number>>({})

    useEffect(() => {
        if (mode !== 'MARKETPLACE') return
        listingApi.getCategories(scope)
            .then(res => {
                const map: Record<string, number> = {}
                for (const row of res.data) map[row.category] = row.count
                setCounts(map)
            })
            .catch(() => setCounts({}))
    }, [mode, scope])

    const options = mode === 'MARKETPLACE' ? LISTING_CATEGORIES : COMMUNITY_CATEGORIES

    return (
        <div className="space-y-3">
            <button
                onClick={() => onApply(null, 'Category')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                    border transition-colors
                    ${current === null
                        ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                        : 'border-white/8 bg-white/4 text-white/60'}`}
            >
                <span className="text-sm font-medium">All Categories</span>
                {current === null && <span className="text-cyan-400 text-base">✓</span>}
            </button>

            <div className="grid grid-cols-2 gap-3">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onApply(opt.value, opt.label)}
                        className={`py-4 px-3 rounded-2xl border text-sm font-semibold transition-colors
                            flex flex-col items-center gap-0.5
                            ${current === opt.value
                                ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                                : 'border-white/8 bg-white/4 text-white/60'}`}
                    >
                        <span>{opt.label}</span>
                        {mode === 'MARKETPLACE' && counts[opt.value] !== undefined && (
                            <span className="text-[11px] text-white/30 font-normal">{counts[opt.value]}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}


function ConditionContent({ current, onApply }: {
    current: string | null
    onApply: (value: string | null, label: string) => void
}) {
    return (
        <div className="space-y-2">
            <button
                onClick={() => onApply(null, 'Condition')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                    border transition-colors
                    ${current === null
                        ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                        : 'border-white/8 bg-white/4 text-white/60'}`}
            >
                <span className="text-sm font-medium">Any Condition</span>
                {current === null && <span className="text-cyan-400 text-base">✓</span>}
            </button>
            {LISTING_CONDITIONS.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onApply(opt.value, opt.label)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                        border transition-colors
                        ${current === opt.value
                            ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                            : 'border-white/8 bg-white/4 text-white/60'}`}
                >
                    <span className="text-sm font-medium">{opt.label}</span>
                    {current === opt.value && <span className="text-cyan-400 text-base">✓</span>}
                </button>
            ))}
        </div>
    )
}
