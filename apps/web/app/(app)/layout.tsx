'use client'

import { usePathname } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { PushNotificationManager } from '@/components/notification/PushNotificationManager'
import { ChatUnreadProvider } from '@/context/ChatUnreadContext'

const FULLSCREEN_ROUTES = [/^\/chat\/dm\/[^/]+$/, /^\/chat\/thread\/[^/]+$/, /^\/communities\/[^/]+$/, /^\/orders\/[^/]+$/]

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isFullscreen = FULLSCREEN_ROUTES.some(pattern => pattern.test(pathname))

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
