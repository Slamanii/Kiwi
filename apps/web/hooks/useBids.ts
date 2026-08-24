'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/context/SocketContext'
import { bidApi } from '@/lib/api/bid'
import type { Bid } from '@/types'

export function useBid(seekId: string) {
    const [bids,      setBids]      = useState<Bid[]>([])
    const [loading,   setLoading]   = useState(true)
    const [selecting, setSelecting] = useState(false)
    const [placing,   setPlacing]   = useState(false)
    const socket = useSocket()

    useEffect(() => {
        if (!seekId) return
        bidApi.getBySeek(seekId)
            .then(res => setBids(res.data.bids))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [seekId])

    const selectBid = useCallback(async (bidId: string) => {
        setSelecting(true)
        try {
            await bidApi.select(bidId)
            // status update comes via socket seek:bidSelected
        } catch (err) {
            throw err
        } finally {
            setSelecting(false)
        }
    }, [])

    const placeBid = useCallback(async (data: { amount: number; rate: number; note?: string }) => {
        setPlacing(true)
        try {
            const res = await bidApi.create(seekId, data)
            setBids(prev => [res.data, ...prev])
        } catch (err) {
            throw err
        } finally {
            setPlacing(false)
        }
    }, [seekId])

    useEffect(() => {
        if (!socket) return

        const onBidSelected = ({ agentId }: { seekId: string; agentId: string }) =>
            setBids(prev => prev.map(b =>
                b.agentId === agentId ? { ...b, status: 'SELECTED' } : b
            ))

        const onNewBid = (bid: Bid) =>
            setBids(prev => [bid, ...prev])

        socket.on('seek:bidSelected', onBidSelected)
        socket.on('seek:newBid',      onNewBid)

        return () => {
            socket.off('seek:bidSelected', onBidSelected)
            socket.off('seek:newBid',      onNewBid)
        }
    }, [socket])

    return { bids, loading, selecting, placing, selectBid, placeBid }
}