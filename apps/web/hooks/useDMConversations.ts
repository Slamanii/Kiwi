'use client'

import { useState, useEffect } from 'react'
import { messageApi } from '@/lib/api/message'
import { useSocket } from '@/context/SocketContext'
import type { DMConversationSummary, Notification } from '@/types'

export function useDMConversations() {
    const [conversations, setConversations] = useState<DMConversationSummary[]>([])
    const [loading, setLoading] = useState(true)
    const socket = useSocket()

    useEffect(() => {
        messageApi.getDMConversations()
            .then(res => setConversations(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!socket) return

        // conversation rooms are only joined while a DM thread is open, so the
        // inbox list learns about new messages via the user's notification feed
        const onNotification = (notification: Notification) => {
            const conversationId = notification.metadata?.conversationId as string | undefined
            if (!conversationId || notification.type !== 'NEW_MESSAGE') return

            setConversations(prev => {
                const existing = prev.find(c => c.id === conversationId)
                if (!existing) {
                    messageApi.getDMConversations().then(res => setConversations(res.data)).catch(console.error)
                    return prev
                }
                const updated = {
                    ...existing,
                    lastMessage: notification.body,
                    lastMessageAt: notification.createdAt,
                    unreadCount: existing.unreadCount + 1,
                }
                return [updated, ...prev.filter(c => c.id !== conversationId)]
            })
        }

        socket.on('notification:new', onNotification)
        return () => { socket.off('notification:new', onNotification) }
    }, [socket])

    const markRead = (conversationId: string) => {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    }

    return { conversations, loading, markRead }
}
