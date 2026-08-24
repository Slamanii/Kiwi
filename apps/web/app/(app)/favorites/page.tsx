'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { listingApi } from '@/lib/api/listing'
import { FavoriteCard } from '@/components/community/FavoriteCard'
import { ChevronLeftIcon } from '@/components/ui/Icons'
import type { FavoritedListing } from '@/types'

export default function FavoritesPage() {
    const router = useRouter()
    const [favorites, setFavorites] = useState<FavoritedListing[]>([])
    const [loading,   setLoading]   = useState(true)

    useEffect(() => {
        listingApi.getMyFavorites()
            .then(res => setFavorites(res.data))
            .finally(() => setLoading(false))
    }, [])

    const handleUnfavorite = (listingId: string) => {
        setFavorites(prev => prev.filter(f => f.id !== listingId))
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
                <h1 className="text-lg font-semibold">Favorites</h1>
            </div>

            <div className="px-4 space-y-3">
                {loading ? (
                    <p className="text-white/25 text-sm text-center py-16">Loading...</p>
                ) : favorites.length === 0 ? (
                    <p className="text-white/25 text-sm text-center py-16">
                        Nothing saved yet. Tap the heart on a listing to save it here.
                    </p>
                ) : (
                    favorites.map(listing => (
                        <FavoriteCard
                            key={listing.id}
                            listing={listing}
                            onUnfavorite={() => handleUnfavorite(listing.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
