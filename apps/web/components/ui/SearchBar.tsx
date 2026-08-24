'use client'
import { useEffect, useState } from 'react'

type SearchBarProps = {
    value: string
    onChange: (value: string) => void
    placeholders?: string[]
    onFocus?: () => void
    fullWidth?: boolean
}

const DEFAULT_PLACEHOLDERS = [
    'try: 10% fees, 1M budget, loft',
    'try: 2 bedroom, Yaba, urgent',
    'try: duplex, Lekki, 500k',
    'try: office space, Lagos Island',
    'try: verified agents, Abuja',
]

export function SearchBar({
    value,
    onChange,
    placeholders = DEFAULT_PLACEHOLDERS,
    onFocus,
    fullWidth = false,
}: SearchBarProps) {
    const [placeholderIndex, setPlaceholderIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(i => (i + 1) % placeholders.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [placeholders.length])

    return (
        <div className={`flex items-center gap-1.5 bg-[#38353B] rounded-full px-3 h-9 ${fullWidth ? 'w-full' : 'w-[45%] mx-auto'}`}>
            <svg
                className="text-gray-500 shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={placeholders[placeholderIndex]}
            className="flex-1 min-w-0 bg-transparent text-[11px] text-white
                        placeholder:text-gray-600 placeholder:transition-all
                        focus:outline-none"
        />
        {value.length > 0 && (
            <button
                onClick={() => onChange('')}
                className="text-gray-500 text-[10px] shrink-0 active:opacity-60"
            >
                x
            </button>
        )}
        </div>
    )
}