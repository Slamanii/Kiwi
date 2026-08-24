import { Avatar } from '@/components/ui/Avatar'
import { RatingStars } from '@/components/profile/RatingStars'

type Review = {
    id: string
    score: number
    comment: string | null
    createdAt: string
    reviewer: {
        id: string
        name: string
        profile?: { avatarUrl?: string | null } | null
    }
}

export function ReviewCard({ review }: { review: Review }) {
    return (
        <div className="bg-[#1c1c1e] rounded-2xl p-4 border border-cyan-500/30">
            <div className="flex items-start gap-3">
                <Avatar
                    src={review.reviewer.profile?.avatarUrl}
                    name={review.reviewer.name}
                    size="md"
                />

                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">
                            {review.reviewer.name}
                        </span>
                        <span className="text-[11px] text-gray-500 shrink-0">
                            {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <RatingStars rating={review.score} size="sm" showValue={false} />

                    {review.comment && (
                        <p className="text-sm text-gray-400">{review.comment}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
