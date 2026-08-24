'use client'

import { useState } from 'react'
import type { Agreement } from '@/types'

interface FeeNegotiationProps {
    agreement: Agreement
    currentUserId: string
    isClient: boolean
    onPropose: (agentFee: number) => Promise<void>
    onAccept: () => Promise<void>
    onEnd: () => Promise<void>
}

export function FeeNegotiation({ agreement, currentUserId, isClient, onPropose, onAccept, onEnd }: FeeNegotiationProps) {
    const [countering, setCountering] = useState(false)
    const [amount, setAmount] = useState(String(agreement.agentFee))
    const [submitting, setSubmitting] = useState<'accept' | 'propose' | 'end' | null>(null)

    const iProposed = agreement.proposedBy === currentUserId
    const proposerLabel = iProposed ? 'You' : isClient ? 'The agent' : 'The client'

    async function handleAccept() {
        setSubmitting('accept')
        try { await onAccept() } finally { setSubmitting(null) }
    }

    async function handlePropose() {
        const fee = Number(amount)
        if (!fee || fee <= 0) return
        setSubmitting('propose')
        try { await onPropose(fee); setCountering(false) } finally { setSubmitting(null) }
    }

    async function handleEnd() {
        setSubmitting('end')
        try { await onEnd() } finally { setSubmitting(null) }
    }

    return (
        <div className="mx-4 rounded-2xl border border-cyan-400/40 bg-neutral-950/80 px-4 py-4 space-y-4">
            <div className="space-y-1">
                <span className="text-white/40 text-[11px] uppercase tracking-widest">{proposerLabel} proposed</span>
                <p className="text-white text-2xl font-semibold">₦{agreement.agentFee.toLocaleString()}</p>
            </div>

            {iProposed ? (
                <p className="text-white/40 text-xs">Waiting on the other party to respond.</p>
            ) : countering ? (
                <div className="space-y-2">
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white text-sm outline-none focus:border-cyan-400/40"
                        placeholder="Enter your counter-offer"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCountering(false)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-white/60 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePropose}
                            disabled={submitting !== null}
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-cyan-400 text-black active:scale-[0.97] disabled:opacity-40 cursor-pointer"
                        >
                            {submitting === 'propose' ? 'Sending…' : 'Send counter'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={handleEnd}
                        disabled={submitting !== null}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-white/60 active:scale-[0.97] disabled:opacity-40 cursor-pointer"
                    >
                        {submitting === 'end' ? 'Ending…' : 'End'}
                    </button>
                    <button
                        onClick={() => setCountering(true)}
                        disabled={submitting !== null}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-white/60 active:scale-[0.97] disabled:opacity-40 cursor-pointer"
                    >
                        Propose
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={submitting !== null}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-cyan-400 text-black active:scale-[0.97] disabled:opacity-40 cursor-pointer"
                    >
                        {submitting === 'accept' ? 'Accepting…' : 'Accept'}
                    </button>
                </div>
            )}
        </div>
    )
}
