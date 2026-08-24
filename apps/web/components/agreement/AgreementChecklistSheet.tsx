'use client'

import { useEffect, useState } from 'react'
import { threadApi } from '@/lib/api/thread'
import type { Agreement, AgreementSentiment, AgreementStage } from '@/types'
import { StageSection } from './StageSection'
import { SignatureBlock } from './SignatureBlock'
import { DealRecap } from './DealRecap'

interface AgreementChecklistSheetProps {
    threadId: string
    threadCreatedAt: string
    currentUserId: string
    isClient: boolean
    onClose: () => void
}

const STAGES: AgreementStage[] = ['BEFORE', 'DURING', 'AFTER']

export function AgreementChecklistSheet({ threadId, threadCreatedAt, currentUserId, isClient, onClose }: AgreementChecklistSheetProps) {
    const [agreement, setAgreement] = useState<Agreement | null>(null)
    const [loading, setLoading] = useState(true)
    const [signing, setSigning] = useState(false)
    const [showRecap, setShowRecap] = useState(false)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        threadApi.getAgreement(threadId)
            .then(res => { if (!cancelled) setAgreement(res.data) })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [threadId])

    async function refresh() {
        const res = await threadApi.getAgreement(threadId)
        setAgreement(res.data)
    }

    async function handleAnswer(itemId: string, sentiment: AgreementSentiment, answer?: string) {
        await threadApi.answerAgreementItem(itemId, sentiment, answer)
        await refresh()
    }

    async function handleSign() {
        if (!agreement) return
        setSigning(true)
        try {
            await threadApi.signAgreement(agreement.id)
            await refresh()
        } finally {
            setSigning(false)
        }
    }

    const itemsComplete = !!agreement && agreement.items.length > 0 && agreement.items.every(i => i.completed)

    async function handleCompleteDeal(score: number, comment?: string) {
        if (!agreement) return
        await threadApi.completeAgreement(agreement.id, { score, comment })
        onClose()
    }

    if (showRecap && agreement) {
        return (
            <DealRecap
                agreement={agreement}
                threadCreatedAt={threadCreatedAt}
                onSubmit={handleCompleteDeal}
                onClose={() => setShowRecap(false)}
            />
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md flex flex-col" style={{ maxHeight: '78vh' }}>
                <div className="mb-5 text-center">
                    <h2 className="text-white font-semibold text-base tracking-wide">Deal Checklist</h2>
                    <p className="text-white/40 text-xs mt-1">Track this deal through to completion</p>
                </div>

                <div
                    className="flex-1 overflow-y-auto space-y-3 pr-0.5"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                    {loading ? (
                        <p className="text-white/30 text-sm text-center py-8">Loading…</p>
                    ) : !agreement ? (
                        <p className="text-white/30 text-sm text-center py-8">No agreement found for this thread.</p>
                    ) : isClient ? (
                        <>
                            {STAGES.map(stage => (
                                <StageSection
                                    key={stage}
                                    stage={stage}
                                    items={agreement.items.filter(i => i.stage === stage)}
                                    onAnswer={handleAnswer}
                                />
                            ))}
                            <SignatureBlock
                                agreement={agreement}
                                isClient={isClient}
                                itemsComplete={itemsComplete}
                                onSign={handleSign}
                                signing={signing}
                                onComplete={() => setShowRecap(true)}
                            />
                        </>
                    ) : (
                        <SignatureBlock
                            agreement={agreement}
                            isClient={isClient}
                            itemsComplete={itemsComplete}
                            onSign={handleSign}
                            signing={signing}
                        />
                    )}

                    <div className="h-1" />
                </div>
            </div>
        </div>
    )
}
