'use client'

import { useState, useEffect, useCallback } from 'react'
import { profileApi } from '@/lib/api/profile'
import type { Review } from '@/types'

export function useReviews(userId: string) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!userId) return
        setLoading(true)
        profileApi.getReviews(userId)
            .then(res => {
                setReviews(res.data.reviews)
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [userId])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await profileApi.getReviews(userId, cursor)
            setReviews(prev => [...prev, ...res.data.reviews])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, userId])

    const submitReview = useCallback(async (data: {
        threadId: string
        score: number
        comment?: string
    }) => {
        setSubmitting(true)
        try {
            const res = await profileApi.submitRating(userId, data)
            setReviews(prev => [res.data, ...prev])
        } catch (err) {
            throw err
        } finally {
            setSubmitting(false)
        }
    }, [userId])

    return { reviews, loading, loadingMore, hasMore, loadMore, submitReview, submitting }
}   