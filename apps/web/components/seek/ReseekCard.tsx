import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Seek, UserRole } from '@/types'
import { ActionRow } from '@/components/seek/ActionRow'
import { SeekTags } from '@/components/seek/SeekTags'
import { formatTime, formatPropertyType} from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { GavelIcon, RepostIcon } from '@/components/ui/Icons'

const RENT_TYPES = ['LOOKING_TO_RENT', 'PROPERTY_FOR_RENT']
const SALE_TYPES = ['LOOKING_TO_BUY', 'PROPERTY_FOR_SALE']


type ReseekCardProps = {
    seek: Seek
    originalSeek: Seek
    userRole?: UserRole
    onLike?: () => void
    onComment?: () => void
    onBookmark?: () => void
    onReseek?: () => void
    onBid?: () => void
    onShare?: () => void
    onPress?: () => void
    onOriginalPress?: () => void
    liked?: boolean
    bookmarked?: boolean
}

export function ReseekCard({
    seek,
    originalSeek,
    userRole,
    onLike,
    onComment,
    onBookmark,
    onReseek,
    onBid,
    onShare,
    onPress,
    onOriginalPress,
    liked,
    bookmarked,
}: ReseekCardProps) {
    const isVerified = seek.author.profile?.verificationStatus === 'VERIFIED'
    const isAgent = userRole === 'AGENT'
    const isRentType = RENT_TYPES.includes(originalSeek.type)
    const isSaleType = SALE_TYPES.includes(originalSeek.type)

        const router = useRouter()

    return (
        <div
            className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3 border border-[#45C0F8]/60"
            onClick={onPress}
        >
            {/* Resharer header */}
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

            {/* Resharer's new content — above the quote */}
            {seek.content && (
                <p className="text-sm text-gray-200 leading-relaxed">
                    {seek.content}
                </p>
            )}

            {/* Original seek — quoted block, clickable */}
            <div
                className="border border-white/10 rounded-xl p-3 space-y-2.5 bg-white/5 active:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); onOriginalPress?.() }}
            >
                {/* Original author */}
                <div className="flex items-center gap-2">
                    <Avatar
                        src={originalSeek.author.profile?.avatarUrl}
                        name={originalSeek.author.name}
                        size="sm"
                    />
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">
                            {originalSeek.author.name}
                        </span>
                        <span className="text-xs text-gray-500">
                            {formatTime(originalSeek.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Inherited rent/sale highlight + property type */}
                <div className="flex flex-wrap gap-2 mt-1.5">
                    {isRentType && (
                        <Badge label={originalSeek.isShortlet ? 'Shortlet' : 'For Rent'} variant="blue" />
                    )}
                    {isSaleType && <Badge label="For Sale" variant="purple" />}
                    {originalSeek.propertyType && (
                        <Badge label={formatPropertyType(originalSeek.propertyType)} variant="green" />
                    )}
                </div>

                {/* Original content — up to 7 lines, trimmed if longer */}
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-[7]">
                    {originalSeek.content}
                </p>

                {/* Inherited tags — not interactive */}
                <SeekTags seek={originalSeek} />
            </div>

            {/* Reseek (non-agents) or Bid (agents) button — below original seek */}
            <div className="flex gap-2">
                {isAgent ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onBid?.() }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5
                                   bg-[#45C0F8] text-black rounded-xl text-sm font-semibold
                                   active:scale-95 transition-transform"
                    >
                        <GavelIcon className="w-4 h-4" /> bid
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); onReseek?.() }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5
                                   bg-[#45C0F8] text-black rounded-xl text-sm font-semibold
                                   active:scale-95 transition-transform"
                    >
                        <RepostIcon className="w-4 h-4" /> reseek
                    </button>
                )}
            </div>

            {/* Action row */}
            <ActionRow
                likeCount={seek.likeCount}
                commentCount={seek.commentCount}
                bidCount={seek.bidCount}
                liked={liked}
                bookmarked={bookmarked}
                onLike={(e) => { e.stopPropagation(); onLike?.() }}
                onComment={(e) => { e.stopPropagation(); onComment?.() }}
                onBid={(e) => { e.stopPropagation(); onPress?.() }}
                onBookmark={(e) => { e.stopPropagation(); onBookmark?.() }}
                onShare={(e) => { e.stopPropagation(); onShare?.() }}
            />
        </div>
    )
}