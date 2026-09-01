'use client'

import { Avatar } from '@/components/ui/Avatar'
import { PhoneIcon, PhoneOffIcon, VideoIcon } from '@/components/ui/Icons'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { useCall } from '@/context/CallContext'

export default function IncomingCallSheet() {
    const { peer, callKind, acceptCall, declineCall } = useCall()

    if (!peer) return null

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-between py-16">
            <div className="flex flex-col items-center gap-4 mt-12">
                <Avatar src={peer.avatarUrl} name={peer.name} size="lg" />
                <span className="flex items-center gap-1.5 text-white text-xl font-semibold">
                    {peer.name}
                    {peer.verified && <VerifiedBadge size="sm" />}
                </span>
                <span className="text-white/50 text-sm">Incoming {callKind === 'video' ? 'video' : 'voice'} call…</span>
            </div>

            <div className="flex items-center gap-16">
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={declineCall}
                        className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white cursor-pointer"
                    >
                        <PhoneOffIcon className="w-7 h-7" />
                    </button>
                    <span className="text-white/50 text-xs">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={acceptCall}
                        className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white cursor-pointer"
                    >
                        {callKind === 'video' ? <VideoIcon className="w-7 h-7" /> : <PhoneIcon className="w-7 h-7" />}
                    </button>
                    <span className="text-white/50 text-xs">Accept</span>
                </div>
            </div>
        </div>
    )
}
