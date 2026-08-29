'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useAuth } from '@/context/AuthContext'
import { useChatUnread } from '@/context/ChatUnreadContext'
import { useState } from 'react'
import { HomeIcon, ExploreIcon, ChatIcon, ProfileIcon } from '@/components/ui/Icons'


const TABS = [
    { href: '/feed', label: 'Home', Icon: HomeIcon },
    { href: '/explore', label: 'Explore', Icon: ExploreIcon },
    { href: '/chat', label: 'Chat', Icon: ChatIcon },
    { href: '/profile', label: 'Profile', Icon: ProfileIcon },
]

const OPTIONS = [
    { label: 'To Rent', type: 'LOOKING_TO_RENT', agentOnly: false },
    { label: 'To Buy', type: 'LOOKING_TO_BUY', agentOnly: false },
    { label: 'For Rent', type: 'PROPERTY_FOR_RENT', agentOnly: false },
    { label: 'For Sale', type: 'PROPERTY_FOR_SALE', agentOnly: false },
    { label: 'Info', type: 'INFO', agentOnly: true }
]

const AGENT_ROLES = ['AGENT', 'DESIGNER', 'DEVELOPER', 'ADMIN']

function getArcPositions(count: number) {
    const radius = 130         // pill center distance from FAB center
    const startAngle = 95
    const endAngle = 215

    return Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0.5 : i / (count - 1)
        const angle = startAngle + (endAngle - startAngle) * t
        const rad = (angle * Math.PI) / 180
        return {
            x: Math.round(radius * Math.cos(rad)),
            y: Math.round(-radius * Math.sin(rad)),
            rotate: Math.round(180 - angle),   // aligns pill with its spoke
        }
    })
}

    const positions = getArcPositions(OPTIONS.length) 

    export function BottomNav() {
        const pathname = usePathname()
        const router = useRouter()
        const hidden = useScrollDirection()
        const { user } = useAuth()
        const { unreadCount } = useChatUnread()
        const [open, setopen] = useState(false)
        const [unauth, setUnauth] = useState(false)

        const isAgent = user?.roles?.some(r => AGENT_ROLES.includes(r)) ?? false

        function handleOption(option: typeof OPTIONS[0]) {
            if (option.agentOnly && !isAgent) {
                setUnauth(true) 
                setTimeout(() => setUnauth(false), 2500)
                return 
            }
            setopen(false)
            router.push(`/container/fullscreen/create?type=${option.type}`)
        }

        return (
            <>
                {open && (
                    <div className="fixed inset-0 z-40" onClick={() => setopen(false)}/>
                )}

                
                    {unauth && (
                        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]
                            bg-neutral-900 border border-red-500/40 text-red-400
                            text-ws font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap
                            animate-fade-in">
                                Only agents, designers & developers can post Info

                        </div>
                    )}

                    <div className={`
                            fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50
                            w-[70%]
                            transition-opacity duration-300
                            ${hidden && !open ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                        `}>
                        <nav className="h-11 bg-[#38353B] backdrop-blur-xl
                                border border-white/20 shadow-lg rounded-3xl
                                flex items-center justify-around px-1 overflow-hidden">
                            {TABS.map(tab => {
                                const active = pathname.startsWith(tab.href)
                                return (
                                    <Link
                                        key={tab.href}
                                        href={tab.href}
                                        className={`relative flex-1 min-w-0 h-full flex flex-col items-center justify-center gap-0 rounded-2xl transition-colors
                                            ${active ? 'text-blue-500' : 'text-gray-400'}`}
                                    >
                                        <span className="relative">
                                            <tab.Icon className="w-[18px] h-[18px]" filled={active} />
                                            {tab.href === '/chat' && unreadCount > 0 && (
                                                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-semibold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1 leading-none">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </span>
                                        <span className={`h-0.5 w-[35%] rounded-full transition-colors duration-300 my-0.5
                                            ${active ? 'bg-blue-500' : 'bg-transparent'}`} />
                                        <span className="text-[9px] leading-none font-medium truncate max-w-full">{tab.label}</span>
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="absolute -top-16 -right-4 z-[55]">
                            <button
                                onClick={() => setopen(prev => !prev)}
                                className="w-14 h-14 rounded-full bg-cyan-400 shadow-lg shadow-black/25
                                    flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <span className={`text-2xl leading-none text-black transition-transform duration-200 ${open ? 'rotate-45' : 'rotate-0'}`}>
                                    +
                                </span>
                            </button>

                            {open && OPTIONS.map((option, i) => {
                              const pos = positions[i]
                                const locked = option.agentOnly && !isAgent
                                return (
                                    <button
                                        key={option.type}
                                        onClick={() => handleOption(option)}
                                        className={`
                                            absolute whitespace-nowrap
                                            border px-3.5 py-2.5 rounded-2xl
                                            text-[13px] font-medium
                                            shadow-lg shadow-black/25
                                            active:scale-95 transition-transform duration-100
                                            ${locked
                                                ? 'bg-neutral-900 border-white/5 text-white/30'
                                                : 'bg-neutral-900 border-cyan-400 text-white'
                                            }
                                        `}
                                        style={{
                                            top: '50%',
                                            left: '50%',
                                            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.rotate}deg)`,
                                            zIndex: 51,
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                
            </>
        )
    }