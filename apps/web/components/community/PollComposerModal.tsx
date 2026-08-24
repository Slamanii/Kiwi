'use client'

import { useState } from 'react'
import { pollApi } from '@/lib/api/poll'
import type { Message } from '@/types'

type Props = {
    communityId: string
    onCreated: (message: Message) => void
    onClose: () => void
}

const MIN_OPTIONS = 2
const MAX_OPTIONS = 8

export function PollComposerModal({ communityId, onCreated, onClose }: Props) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState<string[]>(['', ''])
    const [allowMultiple, setAllowMultiple] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const validOptions = options.map(o => o.trim()).filter(Boolean)
    const canSubmit = question.trim().length > 0 && validOptions.length >= MIN_OPTIONS && !submitting

    const updateOption = (i: number, value: string) => {
        setOptions(prev => prev.map((o, idx) => idx === i ? value : o))
    }

    const addOption = () => {
        if (options.length >= MAX_OPTIONS) return
        setOptions(prev => [...prev, ''])
    }

    const removeOption = (i: number) => {
        if (options.length <= MIN_OPTIONS) return
        setOptions(prev => prev.filter((_, idx) => idx !== i))
    }

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSubmitting(true)
        setError(null)
        try {
            const res = await pollApi.create(communityId, {
                question: question.trim(),
                options: validOptions,
                allowMultiple,
            })
            onCreated(res.data)
            onClose()
        } catch (err: any) {
            setError(err?.response?.data?.error ?? 'Could not create poll')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md flex flex-col" style={{ maxHeight: '78vh' }}>
                <div className="mb-5 text-center">
                    <h2 className="text-white font-semibold text-base tracking-wide">New poll</h2>
                    <p className="text-white/40 text-xs mt-1">Ask the community a question</p>
                </div>

                <div
                    className="rounded-2xl border border-cyan-400/40 bg-neutral-950/80 px-4 pt-4 pb-5 overflow-y-auto"
                    style={{ scrollbarWidth: 'none' }}
                >
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                    <input
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Ask a question"
                        maxLength={300}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40"
                    />

                    <div className="mt-3 space-y-2">
                        {options.map((option, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    value={option}
                                    onChange={e => updateOption(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    maxLength={120}
                                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40"
                                />
                                {options.length > MIN_OPTIONS && (
                                    <button onClick={() => removeOption(i)} className="text-white/40 text-lg px-1">×</button>
                                )}
                            </div>
                        ))}
                    </div>

                    {options.length < MAX_OPTIONS && (
                        <button onClick={addOption} className="mt-2 text-sm font-medium text-cyan-400/70">
                            + Add option
                        </button>
                    )}

                    <button onClick={() => setAllowMultiple(v => !v)} className="flex items-center gap-2 mt-4">
                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs
                            ${allowMultiple ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-white/20'}`}>
                            {allowMultiple && '✓'}
                        </span>
                        <span className="text-sm text-white/70">Allow multiple answers</span>
                    </button>

                    {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full mt-5 py-3 rounded-full bg-cyan-400 text-black text-sm font-semibold disabled:opacity-40"
                    >
                        {submitting ? 'Creating…' : 'Create poll'}
                    </button>

                    <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-white/40">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
