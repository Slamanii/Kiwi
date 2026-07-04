import { Avatar } from '../../components/ui/Avatar'
import { Badge }  from '../../components/ui/Badge'
import { ActionButton } from '../../components/ui/ActionButton'
import { Seek } from '../../types'

type SeekCardProps = {
    seek: Seek
    onBid?: () => void
    onLike?: () => void
    onComment?: () => void
    onBookmark?: () => void
    onReseek?: () => void
    onShare?: () => void
    onPress?: () => void
    liked?: boolean
    bookmarked?: boolean
}

export function SeekCard({
    seek,
    onLike,
    onBid,
    onComment,
    onBookmark,
    onReseek,
    onShare,
    onPress,
    liked,
    bookmarked,
}: SeekCardProps) {
    const isVerified = seek.author.profile?.verificationStatus === 'VERIFIED'

    function formatTime(createdAt: string): import("react").ReactNode {
        throw new Error('Function not implemented.')
    }

    return (
        <div 
            className="bg-[#1c1cle] rounded-2xl p-4 space-y-3 border border-white/5"
            onClick={onPress}
        >
            <div className="flex items-center gap-2">
                <Avatar 
                    src={seek.author.profile?.avatarUrl}
                    name={seek.author.name}
                    size="sm"
                />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-white">
                                {seek.author.name}
                            </span>
                            {isVerified && (
                                <Badge label="verified" variant="green" />
                            )}
                        </div>
                        <span className="text-xs text-gray-400">
                            {formatTime(seek.createdAt)}
                        </span>
                    </div>
            </div>

            {seek.propertyType && (
                <Badge label={formatPropertyType(seek.propertyType)} variant="green" />
            )}
            <p className="text-sm text-gray-200 leading-relaxed line-clamp-4">
                {seek.content}
            </p>

            <div className="flex flex-wrap gap-2">
                {seek.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-300 bg-white/10 px-2.5 py-1 rounded-full">
                        📍 {seek.location}
                    </span>
                )}
                {seek.budget && (
                    <span className="text-xs text-gray-300 bg-white/10 px-2.5 py-1 rounded-full">
                        ₦{seek.budget.toLocaleString()}
                    </span>
                )}
                {seek.urgency && (
                    <span className="text-xs text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full">
                        {seek.urgency.toLowerCase()}
                    </span>
                )}
            </div>

            {seek.type !== 'INFO' && (
                <button
                   onClick={(e) => { e.stopPropagation(); onReseek?.() }}
                   className="w-full flex items-center justif-center gap-2 py-2.5
                                bg-cyan-400/20 text-cyan-300 rounded-xl text-sm font-medium
                                active:scale-95 transition-transform"
                >
                    <span>📚reseek</span>
                </button>
            )}

            <div className="flex items-center justify-between pt-1">
                <ActionButton 
                icon="♡"
                activeicon="♥️"
                active={liked}
                count={seek.likeCount}
                onClick={(e) => { e.stopPropagation(); onLike?.() }}
                />
            </div>
        </div> 
    )
}