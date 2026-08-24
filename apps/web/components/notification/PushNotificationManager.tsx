'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase'
import { authApi } from '@/lib/api/auth'
import { playNotificationSound } from '@/lib/notificationSound'

type IncomingNotification = {
    title: string
    body: string
    url: string
}

export function PushNotificationManager() {
    const { user } = useAuth()
    const router = useRouter()
    const [incoming, setIncoming] = useState<IncomingNotification | null>(null)

    useEffect(() => {
        if (!user) return

        requestNotificationPermission().then(token => {
            if (token) authApi.registerDeviceToken(token)
        })

        const unsub = onForegroundMessage((payload) => {
            playNotificationSound()
            setIncoming({
                title: payload.notification?.title ?? 'Kasa',
                body: payload.notification?.body ?? '',
                url: payload.data?.url ?? '/profile/notifications',
            })
        })

        return () => { unsub.then(fn => fn()) }
    }, [user?.id])

    useEffect(() => {
        if (!incoming) return
        const timeout = setTimeout(() => setIncoming(null), 5000)
        return () => clearTimeout(timeout)
    }, [incoming])

    if (!incoming) return null

    return (
        <button
            onClick={() => {
                router.push(incoming.url)
                setIncoming(null)
            }}
            className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[70]
                       w-[92%] max-w-sm bg-[#25232b] border border-white/10 rounded-2xl
                       px-4 py-3 text-left shadow-lg shadow-black/40 animate-fade-in"
        >
            <p className="text-sm font-semibold text-white">{incoming.title}</p>
            {incoming.body && (
                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{incoming.body}</p>
            )}
        </button>
    )
}
