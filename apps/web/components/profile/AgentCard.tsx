import { Avatar } from '@/components/ui/Avatar'
import { RatingStars } from '@/components/profile/RatingStars'
import { User, Profile } from '@/types'
import { useRouter } from 'next/navigation'


type AgentCardProps = {
    agent: User & { profile: Profile }
    onMessage?: () => void
    onPress?: () => void
}

export function AgentCard({ agent, onMessage, onPress }: AgentCardProps) {
    const isVerified = agent.profile.verificationStatus === 'VERIFIED'

    const router = useRouter()

    return (
        <div
            onClick={onPress}
            className="bg-[#1c1c1e] rounded-2xl p-4 border border-[#45C0F8]
                       active:opacity-70 transition-opacity cursor-pointer"
        >
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <Avatar
                    src={agent.profile.avatarUrl}
                    name={agent.name}
                    size="lg"
                />

                {/* Info + footer tags — kept together so the avatar/chat button center against the full card height */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="space-y-1">
                        <span
                                onClick={e => { e.stopPropagation(); router.push(`/container/fullscreen/profile/${agent.id}`) }}
                                className="text-lg font-bold text-white"
                            >
                            {agent.name}
                        </span>

                        <RatingStars
                            rating={agent.profile.rating}
                            reviewCount={agent.profile.reviewCount}
                            size="sm"
                        />

                        {isVerified && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-cyan-400 font-medium">✓ Verified</span>
                            </div>
                        )}

                        <p className="text-sm text-gray-400 line-clamp-2">
                            {agent.profile.bio?.trim() || 'tell others something about you.'}
                        </p>
                    </div>

                    {/* Footer tags */}
                    <div className="flex items-center justify-center gap-2">
                        {agent.profile.rate != null && (
                            <div className="flex flex-col items-center bg-black rounded-lg px-3 py-1">
                                <span className="text-[10px] text-gray-500">Rate</span>
                                <span className="text-xs font-semibold text-white">
                                    {agent.profile.rate}%
                                </span>
                            </div>
                        )}
                        {agent.profile.zone && (
                            <div className="flex flex-col items-center bg-black rounded-lg px-3 py-1">
                                <span className="text-[10px] text-gray-500">Zone</span>
                                <span className="text-xs font-semibold text-white">{agent.profile.zone}</span>
                            </div>
                        )}
                        {agent.profile.inspectionFee != null && (
                            <div className="flex flex-col items-center bg-black rounded-lg px-3 py-1">
                                <span className="text-[10px] text-gray-500">Inspection</span>
                                <span className="text-xs font-semibold text-white">
                                    {agent.profile.inspectionFee.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Message button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onMessage?.() }}
                    className="w-11 h-11 rounded-xl bg-[#45C0F8] flex items-center
                               justify-center shrink-0 active:scale-95 transition-transform"
                >
                    <span className="text-white text-lg">💬</span>
                </button>
            </div>
        </div>
    )
}