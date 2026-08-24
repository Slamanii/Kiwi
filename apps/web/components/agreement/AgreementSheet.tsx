'use client'

import { useState, useRef, useCallback } from 'react'

interface AgreementPoint {
    id: string
    text: string
}

const AGREEMENT_POINTS: AgreementPoint[] = [
    {
        id: '01',
        text: 'The agent confirms they have full legal authority to represent this property and that all information provided during negotiations is accurate and complete to the best of their knowledge.'
    },
    {
        id: '02',
        text: 'Both parties acknowledge that the terms discussed and agreed upon within this thread — including price, payment schedule, and any stated conditions — constitute the agreed basis for this transaction.'
    },
    {
        id: '03',
        text: 'The client commits to completing the transaction under the agreed conditions. Backing out without valid cause may negatively affect the client\'s standing and rating on Kiwi.'
    },
    {
        id: '04',
        text: 'Both parties consent to Kiwi\'s dispute resolution process in the event of a disagreement arising from this transaction. Kiwi\'s ruling in disputes is considered final for platform purposes.'
    },
    {
        id: '05',
        text: 'Neither party will engage in side agreements that circumvent Kiwi\'s platform for this transaction, including payments made outside of documented or recorded channels.'
    },
    {
        id: '06',
        text: 'Both parties agree that this document is binding and that Kiwi reserves the right to review transaction records and thread history for platform integrity and dispute resolution purposes.'
    }
]



interface AgreementSheetProps {
    onSign: () => void
    onClose: () => void
}

export function AgreementSheet({ onSign, onClose }: AgreementSheetProps) {
    const [checked, setChecked] = useState<Record<string, boolean>>({})
    const scrollRef = useRef<HTMLDivElement>(null)
    const lastSoundTime = useRef(0)
    const audioCtxRef = useRef<AudioContext | null>(null)

    const checkedCount = Object.values(checked).filter(Boolean).length
    const allChecked = AGREEMENT_POINTS.every(p => checked[p.id])

    const playScrollSound = useCallback(() => {
        const now = Date.now()
        if (now - lastSoundTime.current < 120) return
        lastSoundTime.current = now

        try {
            if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
                audioCtxRef.current = new AudioContext()
            }
            const ctx = audioCtxRef.current

            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.type = 'triangle'
            oscillator.frequency.setValueAtTime(1100, ctx.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.07)

            gainNode.gain.setValueAtTime(0.045, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09)

            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 0.09)
        } catch (_) {
            // AudioContext blocked until user gesture — silently ignore
        }
    }, [])

    const toggleCheck = (id: string) => {
        setChecked(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
            {/* backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* sheet — no background on the group itself */}
            <div
                className="relative z-10 w-full max-w-md flex flex-col"
                style={{ maxHeight: '66vh' }}
            >
                {/* header */}
                <div className="mb-5 text-center">
                    <h2 className="text-white font-semibold text-base tracking-wide">
                        Deal Agreement
                    </h2>
                    <p className="text-white/40 text-xs mt-1">
                        Read and acknowledge each point to sign
                    </p>
                </div>

                {/* scrollable list — flex-1 so sign button always shows */}
                <div
                    ref={scrollRef}
                    onScroll={playScrollSound}
                    className="flex-1 overflow-y-auto space-y-3 pr-0.5"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                    {AGREEMENT_POINTS.map(point => (
                        <AgreementCard
                            key={point.id}
                            point={point}
                            checked={!!checked[point.id]}
                            onToggle={() => toggleCheck(point.id)}
                        />
                    ))}

                    {/* bottom breathing room so last card isn't flush against button */}
                    <div className="h-1" />
                </div>

                {/* sign button — outside scroll area, always visible */}
                <div className="pt-4">
                    <button
                        onClick={allChecked ? onSign : undefined}
                        disabled={!allChecked}
                        className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                            allChecked
                                ? 'bg-yellow-400 text-black active:scale-[0.97]'
                                : 'bg-white/8 text-white/25 cursor-not-allowed'
                        }`}
                    >
                        {allChecked
                            ? 'Sign Agreement'
                            : `${checkedCount} of ${AGREEMENT_POINTS.length} acknowledged`}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Agreement Point Card ─────────────────────────────────────────────────────

function AgreementCard({
    point,
    checked,
    onToggle,
}: {
    point: AgreementPoint
    checked: boolean
    onToggle: () => void
}) {
    return (
        /*
         * Gradient border technique:
         * Outer div = gradient background + 1.5px padding → visible as border
         * Inner div = solid card background fills the padding gap
         */
        <div
            className={`p-[1.5px] rounded-2xl transition-all duration-300 ${
                checked
                    ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500'
                    : 'bg-gradient-to-br from-yellow-400/50 via-amber-500/30 to-yellow-600/50'
            }`}
        >
            <div className="bg-neutral-950 rounded-[14px] px-4 py-4 flex gap-3 items-start">
                {/* point index */}
                <span className="text-yellow-500/40 text-[10px] font-mono shrink-0 pt-[3px] tracking-widest">
                    {point.id}
                </span>

                {/* agreement text — height is dynamic based on content */}
                <p className="text-white/75 text-[13px] leading-[1.65] flex-1">
                    {point.text}
                </p>

                {/* checkbox */}
                <button
                    onClick={onToggle}
                    className={`shrink-0 mt-[2px] w-[18px] h-[18px] rounded-[5px] border transition-all duration-200 flex items-center justify-center ${
                        checked
                            ? 'border-yellow-400 bg-yellow-400'
                            : 'border-white/20 bg-transparent'
                    }`}
                >
                    {checked && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path
                                d="M1 3.5L3.2 5.5L8 1"
                                stroke="black"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
