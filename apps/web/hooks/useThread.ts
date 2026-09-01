'use client'

import { threadApi } from '@/lib/api/thread'
import { useState, useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useSocketRoom } from '@/hooks/useSocketRoom'
import type { ThreadDetail } from '@/types'

export function useThread(threadId: string) {
    const [thread, setThread] = useState<ThreadDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [dealCompleted, setDealCompleted] = useState(false)
    const socket = useSocket()

    useEffect(() => {
        if (!threadId) return
        setLoading(true)
        threadApi.getById(threadId)
                 .then(res => setThread(res.data))
                 .catch(console.error)
                 .finally(() => setLoading(false))
    }, [threadId])

    useSocketRoom(socket, 'join:thread', 'leave:thread', threadId)

    useEffect(() => {
        if (!socket) return

        const onTermsAccepted = (data: { clientAccepted: boolean; agentAccepted: boolean }) =>
            setThread(prev => prev ? { ...prev, clientAccepted: data.clientAccepted, agentAccepted: data.agentAccepted } : prev)

        const onEnded = () =>
            setThread(prev => prev ? { ...prev, status: 'CLOSED' } : prev)

        const onCompleted = () =>
            setDealCompleted(true)

        socket.on('thread:termsAccepted', onTermsAccepted)
        socket.on('thread:ended', onEnded)
        socket.on('thread:completed', onCompleted)

        return () => {
            socket.off('thread:termsAccepted', onTermsAccepted)
            socket.off('thread:ended', onEnded)
            socket.off('thread:completed', onCompleted)

        }
    }, [socket])

    return { thread, loading, setThread, dealCompleted }
}

