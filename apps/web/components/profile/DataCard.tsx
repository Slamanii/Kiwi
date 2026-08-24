// components/profile/ProfileStatsGrid.tsx
import { Profile } from '@/types'

type ProfileStatProps = {
    icon: React.ReactNode
    iconBg: string
    count: number
    label: string
    onClick?: () => void
}

type ProfileStatsGridProps = {
    profile: Profile
    onRequestsPress?: () => void
    onReviewsPress?: () => void
}

export function ProfileStatsGrid({
    profile,
    onRequestsPress,
    onReviewsPress,
}: ProfileStatsGridProps) {
    return (
        <div className="flex justify-between gap-2">
            <ProfileStat
                icon={<span>🏠</span>}
                iconBg="bg-purple-500/30"
                count={profile.requests}
                label="Requests"
                onClick={onRequestsPress}
            />
            <ProfileStat
                icon={<span>☰</span>}
                iconBg="bg-yellow-500/30"
                count={profile.ongoing}
                label="Ongoing"
            />
            <ProfileStat
                icon={<span>✓</span>}
                iconBg="bg-green-500/30"
                count={profile.completedDeals}
                label="Completed"
            />
            <ProfileStat
                icon={<span>★</span>}
                iconBg="bg-orange-500/30"
                count={profile.reviewCount}
                label="Reviews"
                onClick={onReviewsPress}
            />
        </div>
    )
}


export function ProfileStat({ icon, iconBg, count, label, onClick }: ProfileStatProps) {
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`w-1/5 flex flex-col items-center gap-2 bg-[#38353B] rounded-2xl py-4
                        ${onClick ? 'active:opacity-70 transition-opacity' : ''}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                {icon}
            </div>
            <span className="text-lg font-bold text-white">{count}</span>
            <span className="text-xs text-gray-400">{label}</span>
        </button>
    )
}