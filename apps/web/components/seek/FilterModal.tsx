'use client'

import { useState } from 'react'
import {
    BUDGET_PRESETS, BUDGET_MAX, BUDGET_STEP, PROPERTY_TYPES,
    STATUS_OPTIONS, NIGERIAN_STATES, formatNaira, LISTING_TYPE_OPTIONS,
    type FilterKey, type AppliedFilters,
    type BudgetFilter, type TypeFilter, type RoomsFilter,
    type StatusFilter, type CityFilter, type ListingTypeFilter
} from '@/lib/filterconfig'
import { ChevronLeftIcon } from '@/components/ui/Icons'

// ─── Budget ────────────────────────────────────────────────
function BudgetContent({ current, onApply }: {
    current?: BudgetFilter
    onApply: (v: BudgetFilter) => void
}) {
    const [lo, setLo] = useState(current?.min ?? 0)
    const [hi, setHi] = useState(current?.max ?? BUDGET_MAX)
    const [activePreset, setActivePreset] = useState<string | null>(current?.label ?? null)

    const applyPreset = (p: { label: string; min?: number; max?: number }) => {
        const newLo = p.min ?? 0
        const newHi = p.max ?? BUDGET_MAX
        setLo(newLo)
        setHi(newHi)
        setActivePreset(p.label)
        onApply({ min: p.min, max: p.max, label: p.label })
    }

    const applyCustom = () => {
        const label = lo === 0 && hi >= BUDGET_MAX
            ? 'Any Budget'
            : `${formatNaira(lo)} – ${hi >= BUDGET_MAX ? `${formatNaira(BUDGET_MAX)}+` : formatNaira(hi)}`
        setActivePreset(null)
        onApply({ min: lo || undefined, max: hi >= BUDGET_MAX ? undefined : hi, label })
    }

    return (
        <div className="space-y-6">
            {/* Custom range */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-4">
                <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">
                    Custom Range
                </p>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-white/40 mb-2">
                            <span>Minimum</span>
                            <span className="text-white font-medium">{formatNaira(lo)}</span>
                        </div>
                        <input type="range"
                            min={0} max={hi - BUDGET_STEP} step={BUDGET_STEP} value={lo}
                            onChange={e => { setLo(Number(e.target.value)); setActivePreset(null) }}
                            className="w-full accent-cyan-400"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-white/40 mb-2">
                            <span>Maximum</span>
                            <span className="text-white font-medium">
                                {hi >= BUDGET_MAX ? `${formatNaira(BUDGET_MAX)}+` : formatNaira(hi)}
                            </span>
                        </div>
                        <input type="range"
                            min={lo + BUDGET_STEP} max={BUDGET_MAX} step={BUDGET_STEP} value={hi}
                            onChange={e => { setHi(Number(e.target.value)); setActivePreset(null) }}
                            className="w-full accent-cyan-400"
                        />
                    </div>
                </div>
                <button
                    onClick={applyCustom}
                    className="w-full py-2.5 rounded-xl bg-cyan-400 text-black text-sm font-semibold
                        active:opacity-80 transition-opacity"
                >
                    Apply Range
                </button>
            </div>

            {/* Presets */}
            <div>
                <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-3">
                    Presets
                </p>
                <div className="space-y-2">
                    {BUDGET_PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => applyPreset(p)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                                border transition-colors
                                ${activePreset === p.label
                                    ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                                    : 'border-white/8 bg-white/4 text-white/60'}`}
                        >
                            <span className="text-sm font-medium">{p.label}</span>
                            {activePreset === p.label && (
                                <span className="text-cyan-400 text-base">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Type ──────────────────────────────────────────────────
function TypeContent({ current, onApply }: {
    current?: TypeFilter
    onApply: (v: TypeFilter) => void
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {PROPERTY_TYPES.map(pt => (
                <button
                    key={pt.value}
                    onClick={() => onApply({ value: pt.value, label: pt.label })}
                    className={`py-5 rounded-2xl border text-sm font-semibold transition-colors
                        ${current?.value === pt.value
                            ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                            : 'border-white/8 bg-white/4 text-white/60'}`}
                >
                    {pt.label}
                </button>
            ))}
        </div>
    )
}

// ─── Rooms ─────────────────────────────────────────────────
function RoomsContent({ current, onApply }: {
    current?: RoomsFilter
    onApply: (v: RoomsFilter) => void
}) {
    const [lo, setLo] = useState(current?.min ?? 1)
    const [hi, setHi] = useState(current?.max ?? 10)

    const handleApply = () => {
        const label = lo === hi
            ? `${lo} Room${lo > 1 ? 's' : ''}`
            : `${lo}–${hi === 10 ? '10+' : hi} Rooms`
        onApply({ min: lo, max: hi, label })
    }

    return (
        <div className="bg-white/5 rounded-2xl p-5 space-y-6">
            {/* Display */}
            <div className="flex justify-center items-baseline gap-2 py-2">
                <span className="text-5xl font-bold text-white tabular-nums">{lo}</span>
                {lo !== hi && (
                    <>
                        <span className="text-2xl text-white/30">–</span>
                        <span className="text-5xl font-bold text-white tabular-nums">
                            {hi === 10 ? '10+' : hi}
                        </span>
                    </>
                )}
                <span className="text-lg text-white/40 ml-1">
                    {lo === hi ? (lo === 1 ? 'room' : 'rooms') : 'rooms'}
                </span>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs text-white/40 mb-2">
                        <span>Minimum</span>
                        <span className="text-white">{lo}</span>
                    </div>
                    <input type="range"
                        min={1} max={hi} step={1} value={lo}
                        onChange={e => setLo(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs text-white/40 mb-2">
                        <span>Maximum</span>
                        <span className="text-white">{hi === 10 ? '10+' : hi}</span>
                    </div>
                    <input type="range"
                        min={lo} max={10} step={1} value={hi}
                        onChange={e => setHi(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                    />
                </div>
            </div>

            <button
                onClick={handleApply}
                className="w-full py-3 rounded-xl bg-cyan-400 text-black text-sm font-semibold
                    active:opacity-80 transition-opacity"
            >
                Apply
            </button>
        </div>
    )
}

// ─── Status ────────────────────────────────────────────────
function StatusContent({ current, onApply }: {
    current?: StatusFilter
    onApply: (v: StatusFilter) => void
}) {
    return (
        <div className="space-y-3">
            {STATUS_OPTIONS.map(s => (
                <button
                    key={s.value}
                    onClick={() => onApply({ value: s.value, label: s.label })}
                    className={`w-full flex flex-col items-start px-5 py-5 rounded-2xl
                        border transition-colors text-left
                        ${current?.value === s.value
                            ? 'border-cyan-400/50 bg-cyan-400/10'
                            : 'border-white/8 bg-white/4'}`}
                >
                    <span className="text-base font-semibold text-white">{s.label}</span>
                    <span className="text-xs text-white/40 mt-1">{s.desc}</span>
                </button>
            ))}
        </div>
    )
}

// ─── City (2-step) ─────────────────────────────────────────
function CityContent({ current, onApply }: {
    current?: CityFilter
    onApply: (v: CityFilter) => void
}) {
    const [selectedState, setSelectedState] = useState(
        current ? NIGERIAN_STATES.find(s => s.value === current.state) ?? null : null
    )

    if (!selectedState) {
        return (
            <div className="space-y-2">
                <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-3">
                    Select State
                </p>
                {NIGERIAN_STATES.map(state => (
                    <button
                        key={state.value}
                        onClick={() => setSelectedState(state)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                            border border-white/8 bg-white/4 text-white/70 active:opacity-60"
                    >
                        <span className="text-sm font-medium">{state.label}</span>
                        <span className="text-white/30 text-lg">›</span>
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <button
                onClick={() => setSelectedState(null)}
                className="flex items-center gap-1.5 text-cyan-400 text-sm font-medium mb-4"
            >
                <ChevronLeftIcon className="w-4 h-4" /> {selectedState.label}
            </button>
            <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-3">
                Select City
            </p>
            {selectedState.cities.map(city => {
                const isActive = current?.city === city.value && current?.state === selectedState.value
                return (
                    <button
                        key={city.value}
                        onClick={() => onApply({
                            state:      selectedState.value,
                            stateLabel: selectedState.label,
                            city:       city.value,
                            cityLabel:  city.label,
                            label:      city.label,
                        })}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                            border transition-colors
                            ${isActive
                                ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                                : 'border-white/8 bg-white/4 text-white/70'}`}
                    >
                        <span className="text-sm font-medium">{city.label}</span>
                        {isActive && <span className="text-cyan-400 text-base">✓</span>}
                    </button>
                )
            })}
        </div>
    )
}

function ListingTypeContent({ current, onApply }: {
    current?: ListingTypeFilter
    onApply:  (v: ListingTypeFilter) => void
}) {

    
    return (
        <div className="space-y-3">
            {LISTING_TYPE_OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onApply({ value: opt.value, label: opt.label })}
                    className={`w-full flex flex-col items-start px-5 py-5 rounded-2xl
                        border transition-colors text-left
                        ${current?.value === opt.value
                            ? 'border-cyan-400/50 bg-cyan-400/10'
                            : 'border-white/8 bg-white/4'}`}
                >
                    <span className="text-base font-semibold text-white">{opt.label}</span>
                    <span className="text-xs text-white/40 mt-1">{opt.desc}</span>
                </button>
            ))}
        </div>
    )
}

// ─── Modal shell ───────────────────────────────────────────
const TITLES: Record<FilterKey, string> = {
    budget: 'Budget',
    type:   'Property Type',
    rooms:  'Rooms',
    status: 'Status',
    city:   'Location',
    listingType: 'Listing Type'
}

type FilterModalProps = {
    open:      boolean
    filterKey: FilterKey | null
    current:   AppliedFilters
    onApply:   (key: FilterKey, value: AppliedFilters[FilterKey]) => void
    onClose:   () => void
}

export function FilterModal({ open, filterKey, current, onApply, onClose }: FilterModalProps) {
    const apply = (key: FilterKey, value: AppliedFilters[FilterKey]) => {
        onApply(key, value)
        onClose()
    }

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col bg-neutral-950
            transition-transform duration-300 ease-out will-change-transform
            ${open ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
        >
            {/* Header */}
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

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
                {filterKey === 'budget' && (
                    <BudgetContent current={current.budget} onApply={v => apply('budget', v)} />
                )}
                {filterKey === 'listingType' && (
                    <ListingTypeContent current={current.listingType} onApply={v => apply('listingType', v)} />
                )}
                {filterKey === 'type' && (
                    <TypeContent current={current.type} onApply={v => apply('type', v)} />
                )}
                {filterKey === 'rooms' && (
                    <RoomsContent current={current.rooms} onApply={v => apply('rooms', v)} />
                )}
                {filterKey === 'status' && (
                    <StatusContent current={current.status} onApply={v => apply('status', v)} />
                )}
                {filterKey === 'city' && (
                    <CityContent current={current.city} onApply={v => apply('city', v)} />
                )}
            </div>
        </div>
    )
}