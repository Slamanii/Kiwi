'use client'

import { useState } from 'react'

interface OrderReviewSheetProps {
    storeName: string
    onSubmit: (score: number, comment?: string) => Promise<void>
    onClose: () => void
}

export function OrderReviewSheet({ storeName, onSubmit, onClose }: OrderReviewSheetProps) {
    const [score, setScore] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-cyan-400/40 bg-neutral-950/95 px-4 py-5 space-y-4">
                <div className="text-center">
                    <h2 className="text-white font-semibold text-base tracking-wide">Rate this order</h2>
                    <p className="text-white/40 text-xs mt-1">How was your experience with {storeName}?</p>
                </div>

                <div className="flex justify-center gap-2">
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

                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Leave a comment (optional)"
                    rows={3}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-cyan-400/40 resize-none"
                />

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="flex gap-2 pt-1">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-3 rounded-xl border border-white/15 text-white/70 text-sm font-medium active:opacity-70 disabled:opacity-40 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-cyan-400 text-black active:scale-[0.97] disabled:opacity-40 cursor-pointer"
                    >
                        {submitting ? 'Submitting…' : 'Submit'}
                    </button>
                </div>
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
