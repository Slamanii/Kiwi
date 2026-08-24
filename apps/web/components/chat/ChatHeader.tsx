'use client'

import Link from 'next/link'
import { SearchBar } from '@/components/ui/SearchBar'
import { UsersIcon } from '@/components/ui/Icons'

type ChatHeaderProps = {
    title: string
    search?: string
    onSearchChange?: (value: string) => void
    onCompose?: () => void
    showCommunities?: boolean
}

const PLACEHOLDERS = ['Search Convo']

export default function ChatHeader({ title, search, onSearchChange, onCompose, showCommunities }: ChatHeaderProps) {
    return (
        <div className="px-4 pt-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/40 text-xs">Messaging</p>
                    <h1 className="text-white text-[28px] font-bold leading-tight">{title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {showCommunities && (
                        <Link href="/communities" className="text-white p-1">
                            <UsersIcon className="w-6 h-6" />
                        </Link>
                    )}
                    {onCompose && (
                        <button onClick={onCompose} className="text-white text-3xl leading-none px-1">
                            +
                        </button>
                    )}
                </div>
            </div>

            {onSearchChange && (
                <SearchBar
                    value={search ?? ''}
                    onChange={onSearchChange}
                    placeholders={PLACEHOLDERS}
                    fullWidth
                />
            )}
        </div>
    )
}
