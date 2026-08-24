'use client'

import { useState } from 'react'
import type { AgreementItem as AgreementItemType, AgreementSentiment } from '@/types'

interface AgreementItemProps {
    item: AgreementItemType
    onAnswer: (itemId: string, sentiment: AgreementSentiment, answer?: string) => Promise<void>
}

function formatUnlockDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            className={`w-3.5 h-3.5 text-cyan-400/60 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
        >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function StatusDot({ item }: { item: AgreementItemType }) {
    const now = new Date()
    const unlocksAt = item.unlocksAt ? new Date(item.unlocksAt) : null
    const color = item.completed
        ? item.sentiment === 'GOOD'
            ? 'bg-emerald-400'
            : 'bg-orange-400'
        : unlocksAt && unlocksAt <= now
        ? 'bg-cyan-400 animate-pulse'
        : 'bg-white/20'
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
}

export function AgreementItem({ item, onAnswer }: AgreementItemProps) {
    const [expanded, setExpanded] = useState(false)
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const now = new Date()
    const unlocksAt = item.unlocksAt ? new Date(item.unlocksAt) : null
    const isAnswerable = !item.completed && !!unlocksAt && unlocksAt <= now
    const isRechecking = !item.completed && !!unlocksAt && unlocksAt > now && !!item.sentiment
    const isLocked = !item.completed && (!unlocksAt || unlocksAt > now) && !item.sentiment

    async function submit(sentiment: AgreementSentiment) {
        setSubmitting(true)
        try {
            await onAnswer(item.id, sentiment, note.trim() || undefined)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-4 rounded-2xl border border-cyan-400/40 bg-neutral-950/80 overflow-hidden">
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left cursor-pointer"
            >
                {item.kind === 'CHECKPOINT' && (
                    <span className="text-cyan-400/50 text-[9px] font-mono shrink-0 tracking-widest uppercase">
                        Check-in
                    </span>
                )}
                <p className={`text-[13px] leading-snug flex-1 ${isLocked ? 'text-white/30' : 'text-white/80'}`}>
                    {item.requirement}
                </p>
                <StatusDot item={item} />
                <ChevronIcon open={expanded} />
            </button>

            {expanded && (
                <div className="px-4 pb-4 pt-0.5 border-t border-white/5">
                    {isLocked && (
                        <p className="text-white/30 text-[11px] pt-3">
                            {unlocksAt ? `Unlocks ${formatUnlockDate(unlocksAt.toISOString())}` : 'Locked'}
                        </p>
                    )}

                    {isRechecking && (
                        <div className="pt-3 space-y-1">
                            <p className="text-orange-400/70 text-[11px]">
                                Marked not moving quickly — we'll check again on {unlocksAt && formatUnlockDate(unlocksAt.toISOString())}.
                            </p>
                            {item.answer && <p className="text-white/40 text-[11px] italic">"{item.answer}"</p>}
                        </div>
                    )}

                    {item.completed && (
                        <div className="pt-3 space-y-1">
                            <span className={`text-[11px] font-semibold ${item.sentiment === 'GOOD' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                {item.sentiment === 'GOOD' ? 'Good' : 'Bad'}
                            </span>
                            {item.answer && <p className="text-white/40 text-[11px] italic">"{item.answer}"</p>}
                        </div>
                    )}

                    {isAnswerable && (
                        <div className="pt-3 space-y-2">
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a note (optional)"
                                disabled={submitting}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/25 outline-none disabled:opacity-40"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => submit('GOOD')}
                                    disabled={submitting}
                                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 active:scale-[0.97] transition-all disabled:opacity-40 cursor-pointer"
                                >
                                    Good
                                </button>
                                <button
                                    onClick={() => submit('BAD')}
                                    disabled={submitting}
                                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 active:scale-[0.97] transition-all disabled:opacity-40 cursor-pointer"
                                >
                                    Bad
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
