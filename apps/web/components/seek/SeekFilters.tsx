'use client'

import { useEffect, useRef, useState } from 'react'
import { FilterModal } from './FilterModal'
import type { AppliedFilters, FilterKey } from '@/lib/filterconfig'

type Props = {
    applied:        AppliedFilters
    onFilterChange: (key: FilterKey, value: AppliedFilters[FilterKey]) => void
    onClearAll:     () => void
}

const PILLS: { key: FilterKey | 'all'; label: string }[] = [
    { key: 'all',    label: 'All'    },
    { key: 'listingType', label: 'Rent / Buy' },  
    { key: 'budget', label: 'Budget' },
    { key: 'type',   label: 'Type'   },
    { key: 'rooms',  label: 'Rooms'  },
    { key: 'city',   label: 'City'   },
    { key: 'status', label: 'Status' },
]

export function SeekFilter({ applied, onFilterChange, onClearAll }: Props) {
    const btnRefs     = useRef<Record<string, HTMLButtonElement | null>>({})
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })
    const [modalKey,  setModalKey]  = useState<FilterKey | null>(null)

    const hasFilter = Object.keys(applied).length > 0

    // Move the sliding pill to "All" when no filters are active
    useEffect(() => {
        if (!hasFilter) {
            const btn = btnRefs.current['all']
            if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
        }
    }, [hasFilter])

    const getLabel = (key: FilterKey | 'all'): string => {
        if (key === 'all') return 'All'
        const v = applied[key as FilterKey] as { label: string } | undefined
        return v?.label ?? PILLS.find(p => p.key === key)!.label
    }

    return (
        <>
            <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar
                bg-white/5 rounded-full mx-4 px-1.5 py-1.5">

                {/* Sliding white pill — only shows for "All" */}
                {!hasFilter && (
                    <div
                        className="absolute top-1 bottom-1 bg-white rounded-full
                            transition-[left,width] duration-300 ease-out"
                        style={{ left: indicator.left, width: indicator.width }}
                    />
                )}

                {PILLS.map(pill => {
                    const isActive = pill.key === 'all' ? !hasFilter : !!applied[pill.key as FilterKey]
                    return (
                        <button
                            key={pill.key}
                            ref={el => { btnRefs.current[pill.key] = el }}
                            onClick={() => {
                                if (pill.key === 'all') { onClearAll(); return }
                                setModalKey(pill.key as FilterKey)
                            }}
                            className={`relative z-10 shrink-0 px-4 py-1 rounded-full text-sm
                                font-medium transition-colors duration-200
                                ${isActive
                                    ? pill.key === 'all'
                                        ? 'text-black'
                                        : 'text-cyan-400 bg-cyan-400/15 border border-cyan-400/30'
                                    : 'text-white/50'
                                }`}
                        >
                            {getLabel(pill.key)}
                        </button>
                    )
                })}
            </div>

            <FilterModal
                open={modalKey !== null}
                filterKey={modalKey}
                current={applied}
                onApply={onFilterChange}
                onClose={() => setModalKey(null)}
            />
        </>
    )
}