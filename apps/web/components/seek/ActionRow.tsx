import { HeartIcon, CommentIcon, BookmarkIcon, ShareIcon, GavelIcon } from '@/components/ui/Icons'

type ActionRowProps = {
    likeCount?: number
    commentCount?: number
    bidCount?: number
    liked?: boolean
    bookmarked?: boolean
    onLike: (e: React.MouseEvent) => void
    onComment: (e: React.MouseEvent) => void
    onBid?: (e: React.MouseEvent) => void
    onBookmark: (e: React.MouseEvent) => void
    onShare: (e: React.MouseEvent) => void
}

export function ActionRow({
    likeCount,
    commentCount,
    bidCount,
    liked,
    bookmarked,
    onLike,
    onComment,
    onBid,
    onBookmark,
    onShare,
}: ActionRowProps) {
    return (
        <div className="flex items-center justify-between pt-1">
            <ActionButton
                icon={<HeartIcon className="w-[18px] h-[18px]" filled={liked} />}
                active={liked} count={likeCount}
                onClick={onLike}
            />
            <ActionButton
                icon={<CommentIcon className="w-[18px] h-[18px]" />}
                count={commentCount}
                onClick={onComment}
            />
            {bidCount !== undefined && (
                <ActionButton
                    icon={<GavelIcon className="w-[18px] h-[18px]" />}
                    count={bidCount}
                    onClick={onBid ?? (() => {})}
                />
            )}
            <ActionButton
                icon={<BookmarkIcon className="w-[18px] h-[18px]" filled={bookmarked} />}
                active={bookmarked}
                onClick={onBookmark}
            />
            <ActionButton icon={<ShareIcon className="w-[18px] h-[18px]" />} onClick={onShare} />
        </div>
    )
}

function ActionButton({ icon, active, count, onClick }: {
    icon: React.ReactNode
    active?: boolean
    count?: number
    onClick: (e: React.MouseEvent) => void
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 text-gray-400 active:scale-95 transition-transform"
        >
            <span className={active ? 'text-green-400' : ''}>
                {icon}
            </span>
            {count !== undefined && count > 0 && (
                <span className="text-xs">{count}</span>
            )}
        </button>
    )
}
