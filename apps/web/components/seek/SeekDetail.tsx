// components/seek/SeekDetailHeader.tsx
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Button } from '@/components/ui/Button'
import { Seek } from '@/types'
import { formatTime } from '@/lib/utils'
import { currencySymbol } from '@/lib/currency'
import { SeekMetaCard } from './SeekMetaCard'
import { HeartIcon, BookmarkIcon, CommentIcon, ShareIcon } from '@/components/ui/Icons'

const RENT_TYPES = ['LOOKING_TO_RENT', 'PROPERTY_FOR_RENT']
const SALE_TYPES = ['LOOKING_TO_BUY', 'PROPERTY_FOR_SALE']

type SeekDetailMetaProps = {
    seek: Seek
    onLocationPress?: () => void
}

type SeekDetailHeaderProps = {
    seek: Seek
    onViewProfile?: () => void
}

type SeekDetailActionsProps = {
    likeCount: number
    liked?: boolean
    bookmarked?: boolean
    onLike: () => void
    onBookmark: () => void
    onComment: () => void
    onShare: () => void
}


export function SeekDetailHeader({ seek, onViewProfile }: SeekDetailHeaderProps) {
    const isVerified = seek.author.profile?.verificationStatus === 'VERIFIED'
    const isRentType = RENT_TYPES.includes(seek.type)
    const isSaleType = SALE_TYPES.includes(seek.type)

    return (
        <div className="space-y-4 px-4 pt-4">
            {/* Author row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar
                        src={seek.author.profile?.avatarUrl}
                        name={seek.author.name}
                        size="lg"
                    />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-semibold text-white">
                                {seek.author.name}
                            </span>
                            {isVerified && <VerifiedBadge />}
                        </div>
                        <span className="text-xs text-gray-400">
                            Posted {formatTime(seek.createdAt)}
                        </span>
                    </div>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onViewProfile}
                    className="rounded-full"
                >
                    View Profile
                </Button>
            </div>

            {/* Rent/Sale highlight + property type badge */}
            <div className="flex flex-wrap gap-2">
                {isRentType && (
                    <Badge label={seek.isShortlet ? 'Shortlet' : 'For Rent'} variant="blue" />
                )}
                {isSaleType && <Badge label="For Sale" variant="purple" />}
                {seek.propertyType && (
                    <Badge label={formatPropertyType(seek.propertyType)} variant="green" />
                )}
            </div>

            {/* Full content — no line clamp */}
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {seek.content}
            </p>

            {/* Reseek quote — original post being reseeked */}
            {seek.isReseek && seek.originalSeek && (
                <div className="border border-white/10 rounded-xl p-3 space-y-2.5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Avatar
                            src={seek.originalSeek.author.profile?.avatarUrl}
                            name={seek.originalSeek.author.name}
                            size="sm"
                        />
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">
                                {seek.originalSeek.author.name}
                            </span>
                            {seek.originalSeek.author.profile?.verificationStatus === 'VERIFIED' && (
                                <VerifiedBadge size="xs" />
                            )}
                            <span className="text-xs text-gray-500">
                                {formatTime(seek.originalSeek.createdAt)}
                            </span>
                        </div>
                    </div>
                    {seek.originalSeek.propertyType && (
                        <Badge label={formatPropertyType(seek.originalSeek.propertyType)} variant="green" />
                    )}
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-[7]">
                        {seek.originalSeek.content}
                    </p>
                </div>
            )}
        </div>
    )
}



export function SeekDetailMeta({ seek, onLocationPress }: SeekDetailMetaProps) {
    return (
        <div className="space-y-2 px-4">
            {seek.location && (
                <SeekMetaCard
                    icon={<span>📍</span>}
                    label="Location"
                    value={seek.location}
                    onClick={onLocationPress}
                />
            )}
            {seek.budget && (
                <SeekMetaCard
                    icon={<span className="text-green-400 font-bold text-xs">{currencySymbol(seek.currency)}</span>}
                    label="Budget / Rent"
                    value={`${currencySymbol(seek.currency)}${seek.budget.toLocaleString()}`}
                />
            )}
            {seek.rooms && (
                <SeekMetaCard
                    icon={<span>🛏</span>}
                    label="Rooms"
                    value={`${seek.rooms} room${seek.rooms > 1 ? 's' : ''}`}
                />
            )}
            {seek.isSingle !== null && seek.isSingle !== undefined && (
                <SeekMetaCard
                    icon={<span>👤</span>}
                    label="Occupancy"
                    value={seek.isSingle ? 'Single occupant' : 'Multiple occupants'}
                />
            )}
            {seek.hasPets !== null && seek.hasPets !== undefined && (
                <SeekMetaCard
                    icon={<span>🐾</span>}
                    label="Pets"
                    value={seek.hasPets ? 'Has pets' : 'No pets'}
                />
            )}
            <SeekMetaCard
                icon={<span>📅</span>}
                label="Posted"
                value={new Date(seek.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}
            />
            {seek.expiresAt && (
                <SeekMetaCard
                    icon={<span>⏳</span>}
                    label="Expires"
                    value={new Date(seek.expiresAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                />
            )}
        </div>
    )
}


export function SeekDetailActions({
    likeCount,
    liked,
    bookmarked,
    onLike,
    onBookmark,
    onComment,
    onShare,
}: SeekDetailActionsProps) {
    return (
        <div className="flex items-center gap-4 px-4 py-4 border-t border-white/5">
            <button
                onClick={onLike}
                className="flex items-center gap-1.5 active:scale-95 transition-transform"
            >
                <span className={liked ? 'text-green-400' : 'text-gray-400'}>
                    <HeartIcon className="w-5 h-5" filled={liked} />
                </span>
                {likeCount > 0 && (
                    <span className="text-sm text-gray-400">{likeCount}</span>
                )}
            </button>
            <button onClick={onBookmark} className="active:scale-95 transition-transform">
                <span className={bookmarked ? 'text-green-400' : 'text-gray-400'}>
                    <BookmarkIcon className="w-5 h-5" filled={bookmarked} />
                </span>
            </button>
            <button onClick={onComment} className="active:scale-95 transition-transform">
                <span className="text-gray-400">
                    <CommentIcon className="w-5 h-5" />
                </span>
            </button>
            <button onClick={onShare} className="active:scale-95 transition-transform">
                <span className="text-gray-400">
                    <ShareIcon className="w-5 h-5" />
                </span>
            </button>
        </div>
    )
}

function formatPropertyType(type: string) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}