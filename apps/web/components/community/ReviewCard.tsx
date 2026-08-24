import { Avatar } from '@/components/ui/Avatar'
import { RatingStars } from '@/components/profile/RatingStars'
import type { CommunityReview } from '@/types'

type ReviewCardProps = {
    review: CommunityReview
}

export function ReviewCard({ review }: ReviewCardProps) {
    return (
        <div className="p-[1.5px] rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500">
            <div className="bg-neutral-950 rounded-[14px] px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <Avatar src={review.reviewer.profile?.avatarUrl} name={review.reviewer.name} size="md" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{review.reviewer.name}</p>
                        <RatingStars rating={review.score} size="sm" showValue={false} />
                    </div>
                </div>
                {review.comment && (
                    <p className="text-white/70 text-sm mt-2.5 leading-relaxed">{review.comment}</p>
                )}
            </div>
        </div>
    )
}
