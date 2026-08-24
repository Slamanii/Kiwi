'use client'

import type { Agreement } from '@/types'
import { threadApi } from '@/lib/api/thread'
import { FeeNegotiation } from './FeeNegotiation'

interface FeeNegotiationModalProps {
    threadId: string
    agreement: Agreement
    currentUserId: string
    isClient: boolean
    onAgreementChange: (agreement: Agreement) => void
    onEnded: () => void
}

export function FeeNegotiationModal({ threadId, agreement, currentUserId, isClient, onAgreementChange, onEnded }: FeeNegotiationModalProps) {
    async function handlePropose(agentFee: number) {
        const res = await threadApi.proposeFee(threadId, agentFee)
        onAgreementChange(res.data)
    }

    async function handleAccept() {
        const res = await threadApi.acceptFee(threadId)
        onAgreementChange(res.data)
    }

    async function handleEnd() {
        await threadApi.endNegotiation(threadId)
        onEnded()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div className="relative z-10 w-full max-w-md">
                <div className="mb-5 text-center">
                    <h2 className="text-white font-semibold text-base tracking-wide">Agree on a Fee</h2>
                    <p className="text-white/40 text-xs mt-1">The checklist unlocks once both parties agree</p>
                </div>

                <FeeNegotiation
                    agreement={agreement}
                    currentUserId={currentUserId}
                    isClient={isClient}
                    onPropose={handlePropose}
                    onAccept={handleAccept}
                    onEnd={handleEnd}
                />
            </div>
        </div>
    )
}
