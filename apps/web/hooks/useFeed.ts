'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api/index'
import { useSocket } from '@/context/SocketContext'
import type { Seek } from '@/types'

interface FeedFilters {
    type?: string
    propertyType?: string
    isSingle?: boolean
    hasPets?: boolean
    location?: string
    urgency?: string
    authorId?: string
}

interface UseFeedOptions {
    filters?: FeedFilters
    limit?: number
}

export function useFeed({ filters = {}, limit = 100 }: UseFeedOptions = {}) {

    const [seeks, setSeeks] = useState<Seek[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const socket = useSocket()

    const fetchSeeks = useCallback(async (cursorParam?: string) => {
        const params = new URLSearchParams()
        params.set('limit', String(limit))
        if (cursorParam) params.set('cursor', cursorParam)
            Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v))
    })
    const res = await api.get(`/seeks?${params.toString()}`)
    return res.data
}, [JSON.stringify(filters), limit])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setSeeks([])
        setCursor(null)
        setHasMore(true)

        fetchSeeks()
            .then(data => {
                if (cancelled) return
                setSeeks(data.data)
                setCursor(data.nextCursor ?? null)
                setHasMore(!!data.nextCursor)
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false) })
            
            return () => { cancelled = true }
    }, [fetchSeeks])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return 
        setLoadingMore(true)
        try {
            const data = await fetchSeeks(cursor)
            setSeeks(prev => [...prev, ...data.data])
            setCursor(data.nextCursor ?? null)
            setHasMore(!!data.nextCursor)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, fetchSeeks])

    useEffect(() => {
        if (!socket) return

        const onNew = (seek: Seek) => setSeeks(prev => [seek, ...prev])
        const onExpired = ({ seekId }: { seekId: string }) => setSeeks(prev => prev.filter(s => s.id !== seekId))
        const onBidSelected = ({ seekId }: { seekId: string }) =>
            setSeeks(prev => prev.map(s => s.id === seekId ? { ...s, status: 'SELECTING'} : s))

        socket.on('seek:new', onNew)
        socket.on('seek:expired', onExpired)
        socket.on('seek:bidSelected', onBidSelected)

        return () => {
            socket.off('seek:new', onNew)
            socket.off('seek:expired', onExpired)
            socket.off('seek:bidSelected', onBidSelected)
        }
    }, [socket])

    return { seeks, loading, loadingMore, hasMore, loadMore }
}
