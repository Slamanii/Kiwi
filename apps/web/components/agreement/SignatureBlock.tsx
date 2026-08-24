'use client'

import type { Agreement } from '@/types'

interface SignatureBlockProps {
    agreement: Agreement
    isClient: boolean
    itemsComplete: boolean
    onSign: () => Promise<void>
    signing?: boolean
    onComplete?: () => void
}

export function SignatureBlock({ agreement, isClient, itemsComplete, onSign, signing, onComplete }: SignatureBlockProps) {
    const mySigned = isClient ? !!agreement.clientSignedAt : !!agreement.agentSignedAt
    const theirsSigned = isClient ? !!agreement.agentSignedAt : !!agreement.clientSignedAt
    const bothSigned = !!agreement.clientSignedAt && !!agreement.agentSignedAt

    if (!itemsComplete) {
        return (
            <div className="mx-4 rounded-2xl border border-cyan-400/40 bg-neutral-950/80 px-4 py-4">
                <p className="text-white/50 text-sm">
                    {isClient
                        ? 'This deal is still in progress — work through the checklist above.'
                        : 'This deal is still in progress.'}
                </p>
            </div>
        )
    }

    return (
        <div className="mx-4 rounded-2xl border border-cyan-400/40 bg-neutral-950/80 px-4 py-4 space-y-3">
            <p className="text-white text-sm font-medium">
                {isClient
                    ? 'This agreement has reached fulfillment.'
                    : 'This agreement has reached fulfillment. Sign to acknowledge.'}
            </p>

            {isClient && (
                <div className="flex items-center justify-between">
                    <span className="text-white/40 text-[11px] uppercase tracking-widest">Settlement fees
                    </span>
                    <span className="text-white text-sm font-semibold">₦{agreement.agentFee.toLocaleString()}</span>
                </div>
            )}

            <div className="space-y-1.5">
                <SignRow label="You" signed={mySigned} />
                <SignRow label={isClient ? 'Agent' : 'Client'} signed={theirsSigned} />
            </div>

            {!bothSigned && (
                <button
                    onClick={onSign}
                    disabled={mySigned || signing}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        mySigned
                            ? 'bg-white/5 text-white/25 cursor-not-allowed'
                            : 'bg-cyan-400 text-black active:scale-[0.97] disabled:opacity-40'
                    }`}
                >
                    {mySigned ? 'Waiting on the other party' : signing ? 'Signing…' : 'Sign to Acknowledge'}
                </button>
            )}

            {bothSigned && isClient && onComplete && (
                <button
                    onClick={onComplete}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-cyan-400 text-black active:scale-[0.97] cursor-pointer"
                >
                    Complete Deal
                </button>
            )}
        </div>
    )
}

function SignRow({ label, signed }: { label: string; signed: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">{label}</span>
            <span className={`text-[11px] font-medium ${signed ? 'text-emerald-400' : 'text-white/30'}`}>
                {signed ? 'Signed' : 'Pending'}
            </span>
        </div>
    )
}
