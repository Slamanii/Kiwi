'use client'

import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type MediaViewportProps = {
    items: MediaItem[]
    initialIndex?: number
    onClose: () => void
}

// Full-screen media viewer shared across the app (bids, listings, catalog, posts, ...) —
// any component that has a MediaItem[] can hand it off here instead of building its own viewer.
export function MediaViewport({ items, initialIndex = 0, onClose }: MediaViewportProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(initialIndex)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ left: initialIndex * el.clientWidth, behavior: 'instant' as ScrollBehavior })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onClose])

    const handleScroll = () => {
        const el = scrollRef.current
        if (!el || el.clientWidth === 0) return
        setIndex(Math.round(el.scrollLeft / el.clientWidth))
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shrink-0">
                {items.length > 1 ? (
                    <span className="text-white/70 text-xs font-medium">{index + 1} / {items.length}</span>
                ) : <span />}
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
                    aria-label="Close"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none' }}
            >
                {items.map((item, i) => (
                    <div key={item.url + i} className="w-full h-full shrink-0 snap-center flex items-center justify-center">
                        {item.type === 'video' ? (
                            <video
                                src={item.url}
                                controls
                                autoPlay={i === index}
                                playsInline
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt="" className="max-w-full max-h-full object-contain" />
                        )}
                    </div>
                ))}
            </div>

            {items.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 py-3 shrink-0">
                    {items.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/30'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
