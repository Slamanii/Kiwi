'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { useSocket } from '@/context/SocketContext'
import { useAuth } from '@/context/AuthContext'

export function useUnreadCount() {
    const [count, setCount] = useState(0)
    const socket = useSocket()
    const { user } = useAuth()

    useEffect(() => {
        if (!user) return
        api.get('/notifications')
            .then(res => setCount(res.data.notifications.length))
            .catch(() => {})
    }, [user?.id])

    useEffect(() => {
        if (!socket) return
        
        const onNew = () => setCount(prev => prev + 1)
        const onRead = () => setCount(prev => Math.max(0, prev - 1))

        socket.on('notification:new', onNew)
        socket.on('notification:read', onRead)

        return () => {
            socket.off('notification:new', onNew)
            socket.off('notification:read', onRead)
        }
    }, [socket])

    const resetCount = () => setCount(0)

    return { count, resetCount }
}