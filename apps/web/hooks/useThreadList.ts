'use client'

import { useState, useEffect } from 'react'
import { threadApi } from '@/lib/api/thread'
import { useSocket } from '@/context/SocketContext'
import type { ThreadSummary, Notification } from '@/types'

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

        // thread rooms are only joined while a thread is open, so the inbox
        // list learns about new messages via the user's notification feed
        // (mirrors the fallback useDMConversations uses for the same reason)
        const onNotification = (notification: Notification) => {
            const threadId = notification.metadata?.threadId as string | undefined
            if (!threadId || notification.type !== 'NEW_MESSAGE') return

            setThreads(prev => prev.map(t => t.id !== threadId ? t : {
                ...t,
                updatedAt: notification.createdAt,
                unreadCount: t.unreadCount + 1,
                messages: [{
                    id: notification.id,
                    content: notification.body,
                    type: 'TEXT',
                    createdAt: notification.createdAt,
                    senderId: '',
                    read: false,
                }],
            }))
        }

        socket.on('thread:new',       onNew)
        socket.on('thread:ended',     onEnded)
        socket.on('thread:completed', onCompleted)
        socket.on('notification:new', onNotification)

        return () => {
            socket.off('thread:new',       onNew)
            socket.off('thread:ended',     onEnded)
            socket.off('thread:completed', onCompleted)
            socket.off('notification:new', onNotification)
        }
    }, [socket])

    return { threads, loading }
}