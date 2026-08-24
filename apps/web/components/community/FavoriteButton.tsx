'use client'

import { useState } from 'react'
import { HeartIcon } from '@/components/ui/Icons'
import { listingApi } from '@/lib/api/listing'

type FavoriteButtonProps = {
    listingId: string
    initialFavorited?: boolean
    size?: 'sm' | 'md'
    onChange?: (favorited: boolean) => void
}

// Reusable anywhere a listing shows up (grid card, detail modal, message bubble) — owns its
// own optimistic toggle state so callers don't need to track favorited-ness themselves.
export function FavoriteButton({ listingId, initialFavorited = false, size = 'md', onChange }: FavoriteButtonProps) {
    const [favorited, setFavorited] = useState(initialFavorited)
    const [loading, setLoading] = useState(false)

    const dim = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
    const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (loading) return
        const next = !favorited
        setFavorited(next)
        onChange?.(next)
        setLoading(true)
        try {
            await (next ? listingApi.favorite(listingId) : listingApi.unfavorite(listingId))
        } catch {
            setFavorited(!next)
            onChange?.(!next)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            className={`${dim} rounded-full flex items-center justify-center transition-colors
                ${favorited ? 'bg-red-500/90 text-white' : 'bg-black/50 text-white/80'}`}
        >
            <HeartIcon className={icon} filled={favorited} />
        </button>
    )
}
