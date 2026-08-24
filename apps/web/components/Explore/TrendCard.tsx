import { SeekCard } from '@/components/seek/SeekCard'
import { ReseekCard } from '@/components/seek/ReseekCard'
import { Seek, UserRole } from '@/types'

type TrendCategory = 'PROPERTY_TYPE' | 'LOCATION' | 'URGENCY' | 'ROOMS' | 'INFO'

type TrendCardProps = {
    category: TrendCategory
    headline: string
    count: number
    computedAt: string
    seeks: Seek[]
    userRole?: UserRole
    onSeekPress?: (seek: Seek) => void
    onLike?: (seekId: string) => void
    onReseek?: (seekId: string) => void
    onBid?: (seekId: string) => void
    onComment?: (seekId: string) => void
    onBookmark?: (seekId: string) => void
    likedIds?: Set<string>
    bookmarkedIds?: Set<string>
    onTrendPress?: () => void
}

const CATEGORY_CONFIG: Record<TrendCategory, { label: string; bg: string; text: string }> = {
    PROPERTY_TYPE: { label: 'Property',  bg: 'bg-green-500/20',  text: 'text-green-400'  },
    LOCATION:      { label: 'Location',  bg: 'bg-gray-500/20',   text: 'text-gray-300'   },
    URGENCY:       { label: 'Urgent',    bg: 'bg-purple-500/20', text: 'text-purple-400' },
    ROOMS:         { label: 'Rooms',     bg: 'bg-blue-500/20',   text: 'text-blue-400'   },
    INFO:          { label: 'Updates',   bg: 'bg-cyan-500/20',   text: 'text-cyan-400'   },
}

export function TrendCard({
    category,
    headline,
    count,
    computedAt,
    seeks,
    userRole,
    onSeekPress,
    onLike,
    onReseek,
    onBid,
    onComment,
    onBookmark,
    likedIds,
    bookmarkedIds,
    onTrendPress,
}: TrendCardProps) {
    const config = CATEGORY_CONFIG[category]

    return (
        <div className="border-b border-white/5 pb-4">
            {/* Badge + headline + meta */}
            <div
                onClick={onTrendPress}
                className={`px-4 pt-4 pb-3 space-y-1.5 ${onTrendPress ? 'cursor-pointer active:opacity-70' : ''}`}
            >
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                                  ${config.bg} ${config.text}`}>
                    {config.label}
                </span>
                <p className="text-sm font-semibold text-white leading-snug">
                    {headline}
                </p>
                <p className="text-xs text-gray-500">
                    {count} post{count !== 1 ? 's' : ''} · updated {formatTime(computedAt)}
                </p>
            </div>

            {/* Seeks */}
            <div className="space-y-3 px-4">
                {seeks.map(seek =>
                    seek.isReseek && seek.originalSeek ? (
                        <ReseekCard
                            key={seek.id}
                            seek={seek}
                            originalSeek={seek.originalSeek}
                            userRole={userRole}
                            onPress={() => onSeekPress?.(seek)}
                            onOriginalPress={() => onSeekPress?.(seek.originalSeek!)}
                            onLike={() => onLike?.(seek.id)}
                            onReseek={() => onReseek?.(seek.id)}
                            onBid={() => onBid?.(seek.id)}
                            onComment={() => onComment?.(seek.id)}
                            onBookmark={() => onBookmark?.(seek.id)}
                            liked={likedIds?.has(seek.id)}
                            bookmarked={bookmarkedIds?.has(seek.id)}
                        />
                    ) : (
                        <SeekCard
                            key={seek.id}
                            seek={seek}
                            userRole={userRole}
                            onPress={() => onSeekPress?.(seek)}
                            onLike={() => onLike?.(seek.id)}
                            onReseek={() => onReseek?.(seek.id)}
                            onBid={() => onBid?.(seek.id)}
                            onComment={() => onComment?.(seek.id)}
                            onBookmark={() => onBookmark?.(seek.id)}
                            liked={likedIds?.has(seek.id)}
                            bookmarked={bookmarkedIds?.has(seek.id)}
                        />
                    )
                )}
            </div>
        </div>
    )
}

function formatTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 1) return 'just now'
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}