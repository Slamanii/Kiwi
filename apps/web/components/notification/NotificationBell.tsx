'use client'

import Link from 'next/link'

type NotificationBellProps = {
    unreadCount?: number
    href?: string
    onClick?: () => void
}

function BellIcon({ className }: { className: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    )
}

export function NotificationBell({ unreadCount = 0, href = '/notifications', onClick }: NotificationBellProps) {
    const hasUnread = unreadCount > 0

    const content = (
        <span
            className="relative w-9 h-9 bg-[#38353B] rounded-full backdrop-blur-md
                       flex items-center justify-center active:scale-95 transition-transform"
        >
            <BellIcon className="w-[18px] h-[18px] text-yellow-400" />
            {hasUnread && (
                <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
                               bg-cyan-400 text-black text-[9px] font-bold
                               flex items-center justify-center leading-none"
                >
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </span>
    )

    if (onClick) {
        return (
            <button onClick={onClick} aria-label="Notifications">
                {content}
            </button>
        )
    }

    return (
        <Link href={href} aria-label="Notifications">
            {content}
        </Link>
    )
}
