'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useChatTabCounts } from '@/hooks/useChatTabCounts'

export default function TabPicker() {
    const pathname = usePathname()
    const counts = useChatTabCounts()

    const TABS = [
        { label: 'Threads', href: '/chat', count: counts.threads },
        { label: 'Chats', href: '/chat/dm', count: counts.dm },
        { label: 'Bids', href: '/chat/bids', count: counts.bids },
        { label: 'Orders', href: '/chat/orders', count: counts.orders },
        { label: 'Archived', href: '/chat/archived', count: 0 },
    ]

    return (
        <div className="flex items-center justify-center gap-2 px-4 pt-4 pb-1 overflow-x-auto no-scrollbar">
            {TABS.map(tab => {
                const active = tab.href === '/chat' ? pathname === '/chat' : pathname.startsWith(tab.href)
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`shrink-0 flex items-center gap-1.5 text-center text-xs font-medium px-3 py-1.5 rounded-full transition-colors
                            ${active ? 'bg-white text-black' : 'bg-white/5 text-white/50'}
                        `}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] font-semibold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1
                                ${active ? 'bg-black text-white' : 'bg-blue-500 text-white'}
                            `}>
                                {tab.count > 99 ? '99+' : tab.count}
                            </span>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}
