import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import { CallProvider } from '@/context/CallContext'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import CallOverlay from '@/components/chat/CallOverlay'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
    title: 'Kasa',
    description: 'Finding your next home',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: '/icons/apple-touch-icon.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Kasa',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#22d3ee',
}

export default function RootLayout({ children }: { children: React.ReactNode}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ServiceWorkerRegistration />
                <AuthProvider>
                    <SocketProvider>
                        <CallProvider>
                            {children}
                            <CallOverlay />
                        </CallProvider>
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    )
}

