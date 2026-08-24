'use client'

import { useState } from 'react'
import type { Agreement, AgreementStage } from '@/types'

interface DealRecapProps {
    agreement: Agreement
    threadCreatedAt: string
    onSubmit: (score: number, comment?: string) => Promise<void>
    onClose: () => void
}

const STAGES: { stage: AgreementStage; label: string }[] = [
    { stage: 'BEFORE', label: 'Before' },
    { stage: 'DURING', label: 'During' },
    { stage: 'AFTER', label: 'After' },
]

function formatDuration(startIso: string) {
    const ms = Date.now() - new Date(startIso).getTime()
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    if (days < 1) return 'less than a day'
    if (days === 1) return '1 day'
    return `${days} days`
}

export function DealRecap({ agreement, threadCreatedAt, onSubmit, onClose }: DealRecapProps) {
    const [score, setScore] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const contentItems = agreement.items.filter(i => i.kind === 'CONTENT')

    async function handleSubmit() {
        if (score < 1) {
            setError('Please choose a rating')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await onSubmit(score, comment.trim() || undefined)
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                    <h2 className="text-white font-semibold text-base tracking-wide">Deal Recap</h2>
                    <p className="text-white/40 text-xs mt-0.5">{formatDuration(threadCreatedAt)} from start to finish</p>
                </div>
                <button onClick={onClose} className="text-white/40 text-xs cursor-pointer">Close</button>
            </div>

            <div
                className="flex-1 overflow-y-auto px-4 py-5 space-y-3"
                style={{ scrollbarWidth: 'none' }}
            >
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                {STAGES.map(({ stage, label }) => {
                    const items = contentItems.filter(i => i.stage === stage)
                    if (items.length === 0) return null
                    return (
                        <div key={stage} className="rounded-2xl border border-cyan-400/40 bg-neutral-950/80 px-4 py-4 space-y-3">
                            <span className="text-white/40 text-[11px] uppercase tracking-widest">{label}</span>
                            {items.map(item => (
                                <div key={item.id} className="flex items-start justify-between gap-3">
                                    <p className="text-white/70 text-sm flex-1">{item.requirement}</p>
                                    <span className={`text-[11px] font-medium shrink-0 ${item.sentiment === 'GOOD' ? 'text-emerald-400' : item.sentiment === 'BAD' ? 'text-red-400' : 'text-white/30'}`}>
                                        {item.sentiment === 'GOOD' ? 'Good' : item.sentiment === 'BAD' ? 'Bad' : '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )
                })}

                <div className="rounded-2xl border border-cyan-400/40 bg-neutral-950/80 px-4 py-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-white/40 text-[11px] uppercase tracking-widest">Agent fee</span>
                        <span className="text-white text-sm font-semibold">₦{agreement.agentFee.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                        <p className="text-white text-sm font-medium">Rate this deal</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setScore(n)}
                                    onMouseEnter={() => setHovered(n)}
                                    onMouseLeave={() => setHovered(0)}
                                    className="cursor-pointer"
                                >
                                    <StarIcon filled={n <= (hovered || score)} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Leave a comment (optional)"
                        rows={3}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-cyan-400/40 resize-none"
                    />

                    {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
            </div>

            <div className="px-4 py-4 border-t border-white/10">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-cyan-400 text-black active:scale-[0.97] disabled:opacity-40 cursor-pointer"
                >
                    {submitting ? 'Completing…' : 'Complete Deal'}
                </button>
            </div>
        </div>
    )
}

function StarIcon({ filled }: { filled: boolean }) {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? '#22d3ee' : 'none'} stroke={filled ? '#22d3ee' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
    )
}
