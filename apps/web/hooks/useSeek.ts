'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { seekApi } from '@/lib/api/seek'
import type { Seek } from '@/types'

export function useSeek(seekId: string) {
    const [seek, setSeek] = useState<Seek | null>(null)
    const [loading, setLoading] = useState(true)
    const socket = useSocket()

    useEffect(() => {
        if (!seekId) return
        setLoading(true)
        seekApi.getById(seekId)
            .then(res => setSeek(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [seekId])

    useEffect(() => {
        if (!socket || !seekId) return
        socket.emit('join:seek', seekId)

        const onBidSelected = (data: { agentId: string; threadId: string }) =>
            setSeek(prev => prev ? {
                ...prev,
                status: 'SELECTING',
                bidCount: prev.bidCount + 1
            } : prev)

        const onExpired = () => 
            setSeek(prev => prev ? { ...prev, status: 'EXPIRED' } : prev)
        
        const onNewBid = () => 
            setSeek(prev => prev ? { ...prev, bidCount: prev.bidCount + 1 } : prev)

        socket.on('seek:bidSelected', onBidSelected)
        socket.on('seek:expired', onExpired)
        socket.on('seek:newBid', onNewBid)

        return () => {
            socket.emit('leave:seek', seekId)
            socket.off('seek:bidSelected', onBidSelected)
            socket.off('seek:expired', onExpired)
            socket.off('seek:newBid', onNewBid)
        }
    }, [socket, seekId])

    return { seek, loading, setSeek }
}