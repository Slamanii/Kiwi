'use client'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import type { Notification } from '@/types'

const REFRESH_TYPES = new Set([
    'VERIFICATION_APPROVED',
    'VERIFICATION_REJECTED',
    'APPLICATION_APPROVED',
    'APPLICATION_REJECTED',
])

export function AuthSocketSync() {
    const { refreshUser } = useAuth()
    const socket = useSocket()

    useEffect(() => {
        if (!socket) return
        const onNotification = (notification: Notification) => {
            if (REFRESH_TYPES.has(notification.type)) refreshUser()
        }
        socket.on('notification:new', onNotification)
        return () => { socket.off('notification:new', onNotification) }
    }, [socket, refreshUser])

    return null
}
