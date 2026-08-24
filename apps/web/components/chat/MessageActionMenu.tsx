'use client'

import { useEffect, useRef } from 'react'
import type { ActionSheetItem } from './ActionSheet'

const MENU_WIDTH = 168
const ITEM_HEIGHT = 38
const MARGIN = 8

type AnchorRect = { top: number; bottom: number; left: number; right: number }

type MessageActionMenuProps = {
    open: boolean
    anchorRect: AnchorRect | null
    align: 'left' | 'right'
    onClose: () => void
    items: ActionSheetItem[]
}

export default function MessageActionMenu({ open, anchorRect, align, onClose, items }: MessageActionMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        function handlePointerDown(e: PointerEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
        }
        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [open, onClose])

    if (!open || !anchorRect) return null

    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const menuHeight = items.length * ITEM_HEIGHT + 8

    let left = align === 'right' ? anchorRect.right - MENU_WIDTH : anchorRect.left
    left = Math.max(MARGIN, Math.min(left, viewportW - MENU_WIDTH - MARGIN))

    const spaceBelow = viewportH - anchorRect.bottom
    const top = spaceBelow > menuHeight + MARGIN
        ? anchorRect.bottom + 6
        : Math.max(MARGIN, anchorRect.top - menuHeight - 6)

    return (
        <>
            <div className="fixed inset-0 z-[100]" onClick={onClose} />
            <div
                ref={menuRef}
                className="fixed z-[101] rounded-xl bg-neutral-800 border border-white/10 shadow-2xl shadow-black/50 py-1 overflow-hidden"
                style={{ top, left, width: MENU_WIDTH }}
            >
                {items.map(item => (
                    <button
                        key={item.key}
                        onClick={() => { item.onSelect(); onClose() }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                    >
                        <span className={item.destructive ? 'text-red-400' : 'text-white/70'}>
                            {item.icon}
                        </span>
                        <span className={`text-[13px] ${item.destructive ? 'text-red-400' : 'text-white/90'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </>
    )
}
