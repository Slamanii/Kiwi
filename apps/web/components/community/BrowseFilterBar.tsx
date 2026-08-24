'use client'

import { useEffect, useRef, useState } from 'react'

export type BrowseFilterKey = 'scope' | 'category' | 'condition' | 'location'

type Props = {
    mode: 'GROUP' | 'MARKETPLACE'
    scopeLabel:      string
    categoryLabel:   string
    conditionLabel:  string
    locationLabel:   string
    scopeIsDefault:    boolean   // scope === 'ALL'
    categoryIsDefault: boolean   // no category selected
    conditionIsDefault: boolean  // no condition selected
    locationIsDefault:  boolean  // no location selected
    onPillClick: (key: BrowseFilterKey) => void
}

export function BrowseFilterBar({
    mode,
    scopeLabel, categoryLabel, conditionLabel, locationLabel,
    scopeIsDefault, categoryIsDefault, conditionIsDefault, locationIsDefault,
    onPillClick,
}: Props) {
    const pills = [
        { key: 'scope' as const,    label: scopeLabel,    isDefault: scopeIsDefault    },
        { key: 'category' as const, label: categoryLabel, isDefault: categoryIsDefault },
        ...(mode === 'MARKETPLACE'
            ? [
                { key: 'condition' as const, label: conditionLabel, isDefault: conditionIsDefault },
                { key: 'location'  as const, label: locationLabel,  isDefault: locationIsDefault  },
            ]
            : [])
    ]

    // Nothing filtered at all (every pill still at its default) — mirrors SeekFilter's
    // "no filter applied" state, where the sliding white pill sits under the first pill.
    const hasFilter = pills.some(p => !p.isDefault)

    const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })

    useEffect(() => {
        if (!hasFilter) {
            const btn = btnRefs.current['scope']
            if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
        }
    }, [hasFilter])

    return (
        <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar
            bg-white/5 rounded-full mx-4 px-1.5 py-1.5">

            {!hasFilter && (
                <div
                    className="absolute top-1 bottom-1 bg-white rounded-full
                        transition-[left,width] duration-300 ease-out"
                    style={{ left: indicator.left, width: indicator.width }}
                />
            )}

            {pills.map(pill => {
                const isActive = !pill.isDefault
                const isDefaultAndUnfiltered = pill.key === 'scope' && !hasFilter
                return (
                    <button
                        key={pill.key}
                        ref={el => { btnRefs.current[pill.key] = el }}
                        onClick={() => onPillClick(pill.key)}
                        className={`relative z-10 shrink-0 px-4 py-1 rounded-full text-sm
                            font-medium transition-colors duration-200
                            ${isDefaultAndUnfiltered
                                ? 'text-black'
                                : isActive
                                    ? 'text-cyan-400 bg-cyan-400/15 border border-cyan-400/30'
                                    : 'text-white/50'
                            }`}
                    >
                        {pill.label}
                    </button>
                )
            })}
        </div>
    )
}
