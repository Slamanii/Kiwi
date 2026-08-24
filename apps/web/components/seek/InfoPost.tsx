import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Seek, UserRole } from '@/types'
import { ActionRow } from '@/components/seek/ActionRow'
import { SeekTags } from '@/components/seek/SeekTags'
import { formatTime, formatPropertyType} from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { GavelIcon, RepostIcon } from '@/components/ui/Icons'


type InfoPostCardProps = {
    seek: Seek
    userRole?: UserRole
    onLike?: () => void
    onComment?: () => void
    onBookmark?: () => void
    onReseek?: () => void
    onBid?: () => void
    onShare?: () => void
    onPress?: () => void
    liked?: boolean
    bookmarked?: boolean
}

export function InfoPostCard({
    seek,
    userRole,
    onLike,
    onComment,
    onBookmark,
    onReseek,
    onBid,
    onShare,
    onPress,
    liked,
    bookmarked,
}: InfoPostCardProps) {
    const isVerified = seek.author.profile?.verificationStatus === 'VERIFIED'
    const isAgent = userRole === 'AGENT'
    const isInfoPost = seek.type === 'INFO'

    const router = useRouter()

    return (
        <div
            className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3 border border-[#45C0F8]/60"
            onClick={onPress}
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <Avatar
                    src={seek.author.profile?.avatarUrl}
                    name={seek.author.name}
                    size="sm"
                />
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span
                            onClick={e => { e.stopPropagation(); router.push(`/container/fullscreen/profile/${seek.author.id}`) }}
                            className="text-sm font-semibold text-white cursor-pointer active:opacity-70"
                        >
                        {seek.author.name}
                        </span>
                        {isVerified && <Badge label="Verified" variant="green" />}
                    </div>
                    <span className="text-xs text-gray-400">{formatTime(seek.createdAt)}</span>
                </div>
            </div>

            {/* Property type badge */}
            {seek.propertyType && (
                <div className="mt-1.5">
                    <Badge label={formatPropertyType(seek.propertyType)} variant="green" />
                </div>
            )}

            {/* Content */}
            <p className="text-sm text-gray-200 leading-relaxed line-clamp-4">
                {seek.content}
            </p>

            {/* Tags */}
            <SeekTags seek={seek} />

            {/* Reseek or Bid button excluded */}
            {!isInfoPost && (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onReseek?.() }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5
                                   bg-cyan-400/20 text-cyan-300 rounded-xl text-sm font-medium
                                   active:scale-95 transition-transform"
                    >
                        <RepostIcon className="w-4 h-4" /> reseek
                    </button>
                    {isAgent && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onBid?.() }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5
                                       bg-green-500/20 text-green-300 rounded-xl text-sm font-medium
                                       active:scale-95 transition-transform"
                        >
                            <GavelIcon className="w-4 h-4" /> bid
                        </button>
                    )}
                </div>
            )}

            {/* Action row */}
            <ActionRow
                likeCount={seek.likeCount}
                commentCount={seek.commentCount}
                liked={liked}
                bookmarked={bookmarked}
                onLike={(e) => { e.stopPropagation(); onLike?.() }}
                onComment={(e) => { e.stopPropagation(); onComment?.() }}
                onBookmark={(e) => { e.stopPropagation(); onBookmark?.() }}
                onShare={(e) => { e.stopPropagation(); onShare?.() }}
            />
        </div>
    )
}