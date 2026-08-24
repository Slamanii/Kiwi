import { ReseekCard } from '@/components/seek/ReseekCard'
import { InfoPostCard } from '@/components/seek/InfoPost'
import { SeekCard } from '@/components/seek/SeekCard'
import type { Seek, UserRole } from '@/types'

type SeekCardHandlers = {
    userRole?: UserRole
    // only share is fine for guests — everything else requires auth
    isLoggedIn: boolean
    requireAuth: () => void
    isLiked?: (seekId: string) => boolean
    isBookmarked?: (seekId: string) => boolean
    onLike?: (seek: Seek) => void
    onComment?: (seek: Seek) => void
    onBookmark?: (seek: Seek) => void
    onReseek?: (seek: Seek) => void
    onBid?: (seek: Seek) => void
    onShare?: (seek: Seek) => void
    onPress?: (seek: Seek) => void
    onOriginalPress?: (seek: Seek) => void
}

export function renderSeekCard(seek: Seek, h: SeekCardHandlers) {
    const gated = (fn?: (target: Seek) => void, target: Seek = seek) => () => {
        if (!h.isLoggedIn) { h.requireAuth(); return }
        fn?.(target)
    }

    const shared = {
        seek,
        userRole:   h.userRole,
        liked:      h.isLiked?.(seek.id),
        bookmarked: h.isBookmarked?.(seek.id),
        onLike:     gated(h.onLike),
        onComment:  gated(h.onComment),
        onBookmark: gated(h.onBookmark),
        onReseek:   gated(h.onReseek),
        onBid:      gated(h.onBid),
        onShare:    () => h.onShare?.(seek),
        onPress:    gated(h.onPress),
    }

    if (seek.isReseek && seek.originalSeek) {
        return (
            <ReseekCard
                key={seek.id}
                {...shared}
                originalSeek={seek.originalSeek}
                onOriginalPress={gated(h.onOriginalPress, seek.originalSeek)}
            />
        )
    }

    if (seek.type === 'INFO') return <InfoPostCard key={seek.id} {...shared} />

    return <SeekCard key={seek.id} {...shared} />
}
