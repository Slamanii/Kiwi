import type { Notification } from '@/types'

type NotificationItemProps = {
    notification: Notification
    onPress?: (notification: Notification) => void
}

function formatTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
}

function BrandAvatar() {
    return (
        <span
            className="w-10 h-10 shrink-0 rounded-full bg-black border border-cyan-400/30
                       flex items-center justify-center"
        >
            <span className="text-cyan-400 font-bold text-sm">K</span>
        </span>
    )
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
    const senderName = notification.metadata?.senderName as string | undefined

    return (
        <button
            onClick={() => onPress?.(notification)}
            className={`w-full flex items-start gap-3 px-4 py-3 text-left rounded-2xl
                        active:bg-white/5 transition-colors
                        ${!notification.read ? 'bg-cyan-400/[0.06]' : 'bg-white/[0.03]'}`}
        >
            <BrandAvatar />

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                        {notification.title}
                    </span>
                    <span className="text-[11px] text-gray-500 shrink-0 pt-0.5">
                        {formatTime(notification.createdAt)}
                    </span>
                </div>

                {senderName && (
                    <span className="text-xs font-medium text-cyan-400">{senderName}</span>
                )}

                <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">
                    {notification.body}
                </p>
            </div>

            {!notification.read && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
            )}
        </button>
    )
}
