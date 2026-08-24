type RatingStarsProps = {
    rating: number
    reviewCount?: number
    size?: 'sm' | 'md' | 'lg'
    showValue?: boolean
}

const STAR_SIZE = {
    sm: 14,
    md: 18,
    lg: 24,
}

const TEXT_SIZE = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
}

function StarIcon({ size, className }: { size: number; className: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            <path d="M12 2.5l2.95 6.34 6.98.68-5.27 4.77 1.53 6.9L12 17.77l-6.19 3.42 1.53-6.9L2.07 9.52l6.98-.68L12 2.5z" />
        </svg>
    )
}

function Star({ fillPercent, size }: { fillPercent: number; size: number }) {
    const clamped = Math.max(0, Math.min(100, fillPercent))
    return (
        <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            <StarIcon size={size} className="absolute inset-0 text-gray-700" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${clamped}%` }}>
                <StarIcon size={size} className="text-yellow-400" />
            </span>
        </span>
    )
}

export function RatingStars({ rating, reviewCount, size = 'md', showValue = true }: RatingStarsProps) {
    const safeRating = Number.isFinite(rating) ? rating : 0
    const starSize = STAR_SIZE[size]

    return (
        <div className="inline-flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => {
                    const fillPercent = (Math.min(Math.max(safeRating - i, 0), 1)) * 100
                    return <Star key={i} fillPercent={fillPercent} size={starSize} />
                })}
            </div>
            {showValue && (
                <span className={`${TEXT_SIZE[size]} text-gray-400`}>
                    {safeRating.toFixed(1)}
                    {reviewCount !== undefined && (
                        <span className="text-gray-500"> ({reviewCount})</span>
                    )}
                </span>
            )}
        </div>
    )
}
