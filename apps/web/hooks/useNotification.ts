'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/context/SocketContext'
import { notificationApi } from '@/lib/api/notification'
import type { Notification } from '@/types'

export function useNotification() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const socket = useSocket()

    useEffect(() => {
        notificationApi.getAll()
            .then(res => {
                setNotifications(res.data.notifications)
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await notificationApi.getAll(cursor)
            setNotifications(prev => [...prev, ...res.data.notifications])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor])

    const markRead = useCallback(async (id: string) => {
        await notificationApi.markRead(id)
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])
    
    useEffect(() => {
        if (!socket) return
        const onNew = (notification: Notification) => 
            setNotifications(prev => [notification, ...prev])
        socket.on('notification:new', onNew)
        return () => { socket.off('notification:new', onNew )}
    }, [socket])

    return { notifications, loading, loadingMore, hasMore, loadMore, markRead }
}