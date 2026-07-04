import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
    title: 'Kiwi',
    description: 'Finding your next home',
    manifest: '/manifest.json',
} 

export default function RootLayout({ children }: { children: React.ReactNode}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <SocketProvider>
                        {children}
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    )
}

