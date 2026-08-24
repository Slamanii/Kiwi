'use client'
import AvatarName from './AvatarName'
import { ChevronLeftIcon, PhoneIcon, VideoIcon } from '@/components/ui/Icons'

type ParticipantHeaderProps = {
    name: string
    avatarUrl?: string | null
    isOnline?: boolean
    subtitle?: string
    onBack?: () => void
    onVoiceCall?: () => void
    onVideoCall?: () => void
    onInfo?: () => void
}

export default function ParticipantHeader({
    name,
    avatarUrl,
    isOnline,
    onBack,
    subtitle,
    onVoiceCall,
    onVideoCall,
    onInfo,
}: ParticipantHeaderProps) {
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
                className="relative flex-1 min-w-0 text-left"
            >
                <AvatarName
                    name={name}
                    avatarUrl={avatarUrl}
                    size="lg"
                    subtitle={subtitle ?? (isOnline ? 'Online' : 'Offline')}
                />
                {isOnline && (
                    <div className="absolute bottom-0.5 left-9 w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                )}
            </button>

            <div className="flex items-center gap-4 shrink-0">
                {onVoiceCall && (
                    <button onClick={onVoiceCall} className="text-white cursor-pointer">
                        <PhoneIcon className="w-5 h-5" />
                    </button>
                )}
                {onVideoCall && (
                    <button onClick={onVideoCall} className="text-white cursor-pointer">
                        <VideoIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    )
}
