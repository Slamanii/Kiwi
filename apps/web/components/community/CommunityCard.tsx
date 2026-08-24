'use client'

import { useRouter } from 'next/navigation'
import AvatarName from '@/components/chat/AvatarName'
import type { Community } from '@/types'

export type CommunityJoinStatus = 'NONE' | 'JOINED' | 'REQUESTED'

type CommunityCardProps = {
    community: Community
    joinStatus: CommunityJoinStatus
    joining?: boolean
    onJoin: () => void
}

export default function CommunityCard({ community, joinStatus, joining, onJoin }: CommunityCardProps) {
    const router = useRouter()
    const isMember = joinStatus === 'JOINED'
    const isRequested = joinStatus === 'REQUESTED'

    return (
        <div
            onClick={() => router.push(`/communities/${community.id}`)}
            className="flex items-center px-4 py-2.5 gap-3 cursor-pointer border-b border-white/5"
        >
            <div className="flex-1 min-w-0">
                <AvatarName
                    name={community.name}
                    avatarUrl={community.avatarUrl}
                    size="lg"
                    subtitle={community.lastMessage ?? community.description ?? `${community.memberCount} ${community.memberCount === 1 ? 'member' : 'members'}`}
                />
            </div>

            <button
                onClick={e => { e.stopPropagation(); if (joinStatus === 'NONE' && !joining) onJoin() }}
                disabled={isMember || isRequested || joining}
                className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full cursor-pointer disabled:cursor-default transition-colors ${
                    isMember
                        ? 'bg-white/5 text-white/40'
                        : isRequested
                            ? 'bg-transparent text-white/40 border border-white/15'
                            : 'bg-cyan-400 text-black active:scale-95'
                }`}
            >
                {isMember ? 'Joined' : isRequested ? 'Request Sent' : joining ? '...' : 'Join'}
            </button>
        </div>
    )
}
