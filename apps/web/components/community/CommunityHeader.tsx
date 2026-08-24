'use client'

import AvatarName from '@/components/chat/AvatarName'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type CommunityHeaderProps = {
    name: string
    avatarUrl?: string | null
    memberCount: number
    subtitle?: string
    onBack?: () => void
    onInfo?: () => void
}

export default function CommunityHeader({
    name,
    avatarUrl,
    memberCount,
    subtitle,
    onBack,
    onInfo,
}: CommunityHeaderProps) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black">
            {onBack && (
                <button
                    onClick={onBack}
                    className="text-white bg-transparent border-none pr-1 cursor-pointer"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            )}
            <button
                onClick={onInfo}
                disabled={!onInfo}
                className="flex-1 min-w-0 text-left"
            >
                <AvatarName
                    name={name}
                    avatarUrl={avatarUrl}
                    size="lg"
                    subtitle={subtitle ?? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
                />
            </button>
        </div>
    )
}
