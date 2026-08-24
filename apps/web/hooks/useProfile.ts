'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/context/SocketContext'
import { profileApi } from '@/lib/api/profile'
import type { Profile } from '@/types'

export function useProfile(userId: string) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const socket = useSocket()

    useEffect(() => {
        if (!userId) return
        setLoading(true)
        profileApi.getById(userId)
            .then(res => (res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [userId])

    useEffect(() => {
        if (!socket || !userId) return
        socket.emit('join:profile', userId)

        const onUpdated = (data: Partial<Profile>) => 
            setProfile(prev => prev ? { ...prev, ...data } : prev)

        const onStatsUpdated = (data: Partial<Profile>) => 
            setProfile(prev => prev ? { ...prev, ...data } : prev)

        const onRatingUpdated = (data: { rating: number; reviewCount: number }) =>
            setProfile(prev => prev ? { ...prev, ...data }: prev)

        socket.on('profile:updated', onUpdated)
        socket.on('profile:statsUpdated', onStatsUpdated)
        socket.on('profile:ratingUpdated', onRatingUpdated)

        return () => {
            socket.emit('leave:profile', userId)
            socket.off('profile:updated', onUpdated)
            socket.off('profile:statsUpdated', onStatsUpdated)
            socket.off('profile:ratingUpdated', onRatingUpdated)
        }
    }, [socket, userId])

    return { profile, loading, setProfile }
}