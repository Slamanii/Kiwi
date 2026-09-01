'use client'

import { useState } from 'react'
import { seekApi } from '@/lib/api/seek'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type CreateReseekSheetProps = {
    seekId: string
    onClose: () => void
    onSuccess: () => void
}

export function CreateReseekSheet({ seekId, onClose, onSuccess }: CreateReseekSheetProps) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    const canSubmit = content.trim().length >= 10

    const handleSubmit = async () => {
        if (!canSubmit) return
        setLoading(true)
        try {
            await seekApi.reseek(seekId, content.trim())
            onSuccess()
        } catch (err: any) {
            alert(err?.response?.data?.error ?? 'Failed to reseek')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-sm bg-neutral-900 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold text-base">Reseek</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center
                            text-white/50 active:opacity-60"
                        aria-label="Close"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                </div>

                <div>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Add your take on this..."
                        rows={4}
                        className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3
                            text-white/80 text-sm placeholder:text-white/20
                            resize-none focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <p className={`text-xs mt-1.5 text-right ${canSubmit ? 'text-white/20' : 'text-white/40'}`}>
                        {content.trim().length}/10 minimum
                    </p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all
                        ${canSubmit && !loading
                            ? 'bg-cyan-500 text-white active:bg-cyan-600'
                            : 'bg-white/6 text-white/20 cursor-not-allowed'
                        }`}
                >
                    {loading ? 'Reseeking...' : 'Reseek'}
                </button>
            </div>
        </div>
    )
}
