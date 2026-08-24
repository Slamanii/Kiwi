// useAgreement.ts
'use client'

import { useState, useCallback } from 'react'
import { threadApi } from '@/lib/api/thread'

// useAgreement only handles actions — thread state (clientAccepted,
// agentAccepted, status) lives in useThread which is used alongside this
export function useAgreement(threadId: string) {
    const [accepting,   setAccepting]   = useState(false)
    const [completing,  setCompleting]  = useState(false)
    const [disputing,   setDisputing]   = useState(false)

    const acceptTerms = useCallback(async () => {
        setAccepting(true)
        try {
            await threadApi.acceptTerms(threadId)
        } catch (err) {
            throw err
        } finally {
            setAccepting(false)
        }
    }, [threadId])

    const completeAgreement = useCallback(async (
        agreementId: string,
        rating: { score: number; comment?: string }
    ) => {
        setCompleting(true)
        try {
            await threadApi.completeAgreement(agreementId, rating)
        } catch (err) {
            throw err
        } finally {
            setCompleting(false)
        }
    }, [])

    const disputeAgreement = useCallback(async (agreementId: string, reason?: string) => {
        setDisputing(true)
        try {
            await threadApi.disputeAgreement(agreementId, reason)
        } catch (err) {
            throw err
        } finally {
            setDisputing(false)
        }
    }, [])

    return { acceptTerms, accepting, completeAgreement, completing, disputeAgreement, disputing }
}