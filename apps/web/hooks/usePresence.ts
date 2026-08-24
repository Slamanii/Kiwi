'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/context/SocketContext'

export function usePresence(peerId?: string) {
    const socket = useSocket()
    const [online, setOnline] = useState(false)
    const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)

    useEffect(() => {
        if (!socket || !peerId) return

        socket.emit('presence:get', peerId, (data: { online: boolean; lastSeenAt: string | null }) => {
            setOnline(data.online)
            setLastSeenAt(data.lastSeenAt)
        })

        function onUpdate(payload: { userId: string; online: boolean; lastSeenAt: string | null }) {
            if (payload.userId !== peerId) return
            setOnline(payload.online)
            setLastSeenAt(payload.lastSeenAt)
        }

        socket.on('presence:update', onUpdate)
        return () => { socket.off('presence:update', onUpdate) }
    }, [socket, peerId])

    return { online, lastSeenAt }
}

export function formatLastSeen(lastSeenAt: string | null) {
    if (!lastSeenAt) return 'Offline'
    const diffMs = Date.now() - new Date(lastSeenAt).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Last seen just now'
    if (mins < 60) return `Last seen ${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Last seen ${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Last seen ${days}d ago`
    return `Last seen ${new Date(lastSeenAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}
