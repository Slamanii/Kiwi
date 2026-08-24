'use client'

import { useState } from 'react'
import { NIGERIAN_STATES, type NigerianState } from '@/lib/filterconfig'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type Props = {
    current: string | null
    onApply: (value: string | null, label: string) => void
}

// Reusable location-picking content: structured state → city selection (no Google API),
// with a manual free-text fallback. Used both inside BrowseFilterModal's location step
// and standalone via LocationPickerSheet for listing creation — same picker everywhere.
export function LocationPickerContent({ current, onApply }: Props) {
    const [mode, setMode] = useState<'pick' | 'manual'>('pick')
    const [selectedState, setSelectedState] = useState<NigerianState | null>(null)
    const [manualValue, setManualValue] = useState(current ?? '')

    return (
        <div className="space-y-4">
            <div className="relative flex items-center gap-1 bg-white/5 rounded-full p-1">
                {(['pick', 'manual'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 text-center text-xs font-medium py-1.5 rounded-full transition-colors
                            ${mode === m ? 'bg-cyan-400 text-black' : 'text-white/50'}`}
                    >
                        {m === 'pick' ? 'Choose area' : 'Type manually'}
                    </button>
                ))}
            </div>

            {mode === 'manual' ? (
                <div className="space-y-3">
                    <input
                        value={manualValue}
                        onChange={e => setManualValue(e.target.value)}
                        placeholder="e.g. Lekki, Yaba, Ikeja"
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/8
                            text-sm text-white placeholder:text-white/30 outline-none
                            focus:border-cyan-400/40"
                    />
                    <div className="flex gap-3">
                        {current && (
                            <button
                                onClick={() => onApply(null, 'Location')}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-semibold
                                    active:opacity-80 transition-opacity"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={() => manualValue.trim() && onApply(manualValue.trim(), manualValue.trim())}
                            disabled={!manualValue.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-cyan-400 text-black text-sm font-semibold
                                active:opacity-80 transition-opacity disabled:opacity-40"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            ) : !selectedState ? (
                <div className="space-y-2">
                    <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-1">Select State</p>
                    {NIGERIAN_STATES.map(state => (
                        <button
                            key={state.value}
                            onClick={() => setSelectedState(state)}
                            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                                border border-white/8 bg-white/4 text-white/70 transition-colors"
                        >
                            <span className="text-sm font-medium">{state.label}</span>
                            <span className="text-white/30 text-lg">›</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    <button
                        onClick={() => setSelectedState(null)}
                        className="flex items-center gap-1.5 text-cyan-400 text-sm font-medium mb-2"
                    >
                        <ChevronLeftIcon className="w-4 h-4" /> {selectedState.label}
                    </button>
                    <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-1">Select City</p>
                    {selectedState.cities.map(city => {
                        const label = `${city.label}, ${selectedState.label}`
                        const isActive = current === label
                        return (
                            <button
                                key={city.value}
                                onClick={() => onApply(label, label)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl
                                    border transition-colors
                                    ${isActive
                                        ? 'border-cyan-400/50 bg-cyan-400/10 text-white'
                                        : 'border-white/8 bg-white/4 text-white/60'}`}
                            >
                                <span className="text-sm font-medium">{city.label}</span>
                                {isActive && <span className="text-cyan-400 text-base">✓</span>}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

type SheetProps = Props & {
    open: boolean
    onClose: () => void
}

// Standalone bottom-sheet wrapper around LocationPickerContent, for use outside
// BrowseFilterModal (which already provides its own sheet chrome).
export function LocationPickerSheet({ open, current, onApply, onClose }: SheetProps) {
    return (
        <div
            className={`fixed inset-0 z-[100] flex items-end bg-black/60 transition-opacity duration-200
                ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`w-full max-h-[85vh] overflow-y-auto bg-neutral-950 rounded-t-3xl px-4 pt-4 pb-8
                    transition-transform duration-300 ease-out
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-semibold text-white">Location</span>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/60 active:opacity-70"
                        aria-label="Close"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                </div>
                <LocationPickerContent current={current} onApply={(v, l) => { onApply(v, l); onClose() }} />
            </div>
        </div>
    )
}
