'use client'

import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { PaperclipIcon } from '@/components/ui/Icons'
import type { Message } from '@/types'

function formatFileSize(bytes?: number) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type MediaMessageBubbleProps = {
    message: Message
    isSent: boolean
    timestamp: string
    senderName?: string
    senderAvatarUrl?: string | null
    senderVerified?: boolean
    onOpenMedia: () => void
}

export default function MediaMessageBubble({
    message,
    isSent,
    timestamp,
    senderName,
    senderAvatarUrl,
    senderVerified,
    onOpenMedia,
}: MediaMessageBubbleProps) {
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
                    className={`overflow-hidden ${
                        isSent
                            ? 'bg-blue-500 rounded-[18px_18px_4px_18px]'
                            : 'bg-[#1c1c1e] rounded-[18px_18px_18px_4px]'
                    }`}
                >
                    {message.type === 'IMAGE' && message.mediaUrl && (
                        <button onClick={onOpenMedia} className="block w-full">
                            <img src={message.mediaUrl} alt="" className="w-full max-h-72 object-cover" />
                        </button>
                    )}
                    {message.type === 'VIDEO' && message.mediaUrl && (
                        <video src={message.mediaUrl} controls playsInline className="w-full max-h-72" />
                    )}
                    {message.type === 'AUDIO' && message.mediaUrl && (
                        <div className="px-3 py-3">
                            <audio src={message.mediaUrl} controls className="max-w-full" style={{ height: 36 }} />
                        </div>
                    )}
                    {message.type === 'FILE' && message.mediaUrl && (
                        <a
                            href={message.mediaUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3.5 py-3 text-white"
                        >
                            <PaperclipIcon className="w-5 h-5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm truncate">{message.fileName ?? 'File'}</p>
                                {message.mediaSize && (
                                    <p className="text-white/50 text-[11px]">{formatFileSize(message.mediaSize)}</p>
                                )}
                            </div>
                        </a>
                    )}
                </div>
                <div className={`text-white/30 text-[11px] mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                    {timestamp}
                </div>
            </div>
        </div>
    )
}
