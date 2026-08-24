'use client'

import { useState, useEffect } from 'react'
import { threadApi } from '@/lib/api/thread'
import { useSocket } from '@/context/SocketContext'
import type { ThreadSummary } from '@/types'

// getMyThreads has no pagination on the backend today — it returns every
// thread the user is party to in one shot, so there's no cursor to track here
export function useThreadList() {
    const [threads, setThreads] = useState<ThreadSummary[]>([])
    const [loading,  setLoading] = useState(true)
    const socket = useSocket()

    useEffect(() => {
        threadApi.getMyThreads()
            .then(res => setThreads(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!socket) return

        const onNew = (thread: ThreadSummary) =>
            setThreads(prev => [thread, ...prev])

        const onEnded = ({ threadId }: { threadId: string }) =>
            setThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: 'CLOSED' } : t))

        const onCompleted = ({ threadId }: { threadId: string }) =>
            setThreads(prev => prev.map(t => t.id === threadId
                ? { ...t, status: 'CLOSED', agreement: t.agreement ? { ...t.agreement, status: 'COMPLETED' } : t.agreement }
                : t
            ))

        socket.on('thread:new',       onNew)
        socket.on('thread:ended',     onEnded)
        socket.on('thread:completed', onCompleted)

        return () => {
            socket.off('thread:new',       onNew)
            socket.off('thread:ended',     onEnded)
            socket.off('thread:completed', onCompleted)
        }
    }, [socket])

    return { threads, loading }
}