'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { NotificationItem } from '@/components/notification/NotificationItem'
import { notificationApi } from '@/lib/api/notification'
import { ChevronLeftIcon } from '@/components/ui/Icons'

export default function NotificationsPage() {
    const router = useRouter()
    const { notifications, loading, loadingMore, hasMore, loadMore, markRead } = useNotification()
    const [markingAll, setMarkingAll] = useState(false)

    const handleMarkAllRead = async () => {
        setMarkingAll(true)
        try {
            await notificationApi.markAllRead()
            notifications.forEach(n => { if (!n.read) markRead(n.id) })
        } finally {
            setMarkingAll(false)
        }
    }

    const handlePress = (n: (typeof notifications)[number]) => {
        markRead(n.id)
        router.push((n.metadata?.url as string | undefined) ?? '/profile/notifications')
    }

    const hasUnread = notifications.some(n => !n.read)

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">
            <div className="flex items-center justify-between px-4 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                        aria-label="Back"
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-lg font-semibold">Notifications</h1>
                </div>
                {hasUnread && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className="text-xs text-blue-400 disabled:opacity-40"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {loading ? (
                <p className="text-white/25 text-sm text-center py-20">Loading notifications...</p>
            ) : notifications.length === 0 ? (
                <p className="text-white/25 text-sm text-center py-20">No notifications yet.</p>
            ) : (
                <div className="px-4 space-y-2">
                    {notifications.map(n => (
                        <NotificationItem key={n.id} notification={n} onPress={handlePress} />
                    ))}
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="w-full py-3 text-sm text-blue-400 disabled:opacity-40"
                        >
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
