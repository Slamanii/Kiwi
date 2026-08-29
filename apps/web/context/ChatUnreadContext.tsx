'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { threadApi } from '@/lib/api/thread'
import { messageApi } from '@/lib/api/message'
import { orderApi } from '@/lib/api/order'
import { useSocket } from './SocketContext'
import type { Notification } from '@/types'

type ChatUnreadContextType = {
    unreadCount: number
    refreshUnreadCount: () => void
}

const ChatUnreadContext = createContext<ChatUnreadContextType | null>(null)

function sum(list: { unreadCount?: number }[]) {
    return list.reduce((total, item) => total + (item.unreadCount ?? 0), 0)
}

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0)
    const socket = useSocket()

    const refreshUnreadCount = useCallback(() => {
        Promise.all([
            threadApi.getMyThreads().catch(() => ({ data: [] })),
            messageApi.getDMConversations().catch(() => ({ data: [] })),
            orderApi.getMyConversations().catch(() => ({ data: [] })),
        ]).then(([threadsRes, dmRes, ordersRes]) => {
            setUnreadCount(sum(threadsRes.data ?? []) + sum(dmRes.data ?? []) + sum(ordersRes.data ?? []))
        })
    }, [])

    useEffect(() => { refreshUnreadCount() }, [refreshUnreadCount])

    useEffect(() => {
        if (!socket) return
        const onNotification = (notification: Notification) => {
            if (notification.type === 'NEW_MESSAGE') refreshUnreadCount()
        }
        socket.on('notification:new', onNotification)
        return () => { socket.off('notification:new', onNotification) }
    }, [socket, refreshUnreadCount])

    return (
        <ChatUnreadContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </ChatUnreadContext.Provider>
    )
}

export function useChatUnread() {
    const ctx = useContext(ChatUnreadContext)
    if (!ctx) throw new Error('useChatUnread must be used inside ChatUnreadProvider')
    return ctx
}
