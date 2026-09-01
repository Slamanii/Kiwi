import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

type MessageBubbleProps = {
    content: string
    isSent: boolean
    timestamp: string
    senderName?: string
    senderAvatarUrl?: string | null
    senderVerified?: boolean
}

export default function MessageBubble({
    content,
    isSent,
    timestamp,
    senderName,
    senderAvatarUrl,
    senderVerified,
}: MessageBubbleProps) {
    const showSenderInfo = !!senderName && !isSent

    return (
        <div className={`flex px-4 py-1 gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
            {showSenderInfo && (
                <div className="shrink-0 self-end">
                    <Avatar src={senderAvatarUrl} name={senderName} size="sm" />
                </div>
            )}
            <div className="max-w-[70%]">
                {showSenderInfo && (
                    <div className="flex items-center gap-1 text-white/40 text-[11px] mb-1 pl-1">
                        {senderName}
                        {senderVerified && <VerifiedBadge size="xs" />}
                    </div>
                )}
                <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                        isSent
                            ? 'bg-blue-500 text-white rounded-[18px_18px_4px_18px]'
                            : 'bg-[#1c1c1e] text-white rounded-[18px_18px_18px_4px]'
                    }`}
                >
                    {content}
                </div>
                <div className={`text-white/30 text-[11px] mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                    {timestamp}
                </div>
            </div>
        </div>
    )
}
