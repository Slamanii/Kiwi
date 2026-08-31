'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Applications', href: '/admin/applications' },
    { label: 'Verifications', href: '/admin/verifications' },
    { label: 'Admins', href: '/admin/admins' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    const isAdmin = user?.roles?.includes('ADMIN') ?? false

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.replace('/login')
        } else if (!isAdmin) {
            router.replace('/feed')
        }
    }, [loading, user, isAdmin, router])

    if (loading || !isAdmin) return null

    return (
        <div className="min-h-dvh w-full overflow-x-hidden bg-[#101012] text-white">
            <div
                className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
            >
                <header className="flex flex-col gap-3 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-lg font-semibold">Kiwi Admin</h1>
                    <nav className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        {NAV_ITEMS.map(item => {
                            const active = item.href === '/admin'
                                ? pathname === '/admin'
                                : pathname?.startsWith(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-white text-black'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </header>
                {children}
            </div>
        </div>
    )
}
