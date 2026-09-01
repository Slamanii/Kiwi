'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { PushNotificationManager } from '@/components/notification/PushNotificationManager'
import { ChatUnreadProvider } from '@/context/ChatUnreadContext'

const SHOW_NAV_ROUTES = [
    /^\/feed$/,
    /^\/explore$/,
    /^\/chat$/,
    /^\/chat\/dm$/,
    /^\/chat\/bids$/,
    /^\/chat\/orders$/,
    /^\/chat\/archived$/,
    /^\/profile$/,
    /^\/communities$/,
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isFullscreen = !SHOW_NAV_ROUTES.some(pattern => pattern.test(pathname))

    return (
        <ChatUnreadProvider>
            <div className="relative h-dvh flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <PushNotificationManager />
                <main id="main-scroll" className={`flex-1 ${isFullscreen ? 'overflow-hidden' : 'overflow-y-auto pb-24'}`}>
                    {children}
                </main>
                {!isFullscreen && <BottomNav />}
            </div>
        </ChatUnreadProvider>
    )
}
