'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { profileApi } from '@/lib/api/profile'
import { ReviewCard } from '@/components/profile/ReviewCard'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type Review = {
    id: string
    score: number
    comment: string | null
    createdAt: string
    reviewer: {
        id: string
        name: string
        profile?: { avatarUrl?: string | null } | null
    }
}

export default function ReviewsPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()

    const [reviews,     setReviews]     = useState<Review[]>([])
    const [cursor,      setCursor]      = useState<string | null>(null)
    const [hasMore,     setHasMore]     = useState(false)
    const [loading,     setLoading]     = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const load = useCallback(async (cursorParam?: string) => {
        const res = await profileApi.getReviews(params.id, cursorParam)
        return res.data
    }, [params.id])

    useEffect(() => {
        setLoading(true)
        load()
            .then(data => {
                setReviews(data.reviews)
                setCursor(data.nextCursor ?? null)
                setHasMore(!!data.nextCursor)
            })
            .finally(() => setLoading(false))
    }, [load])

    const loadMore = async () => {
        if (!cursor || loadingMore) return
        setLoadingMore(true)
        try {
            const data = await load(cursor)
            setReviews(prev => [...prev, ...data.reviews])
            setCursor(data.nextCursor ?? null)
            setHasMore(!!data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">
            <div className="flex items-center gap-3 px-4 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-lg font-semibold">Reviews</h1>
            </div>

            <div className="px-4 space-y-3">
                {loading ? (
                    <p className="text-white/25 text-sm text-center py-20">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <p className="text-white/25 text-sm text-center py-20">No reviews yet.</p>
                ) : (
                    <>
                        {reviews.map(review => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                        {hasMore && (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="w-full py-3 text-sm text-blue-400 disabled:opacity-40"
                            >
                                {loadingMore ? 'Loading...' : 'Load more'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
