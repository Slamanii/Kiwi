'use client'

import { useRef, useState } from 'react'

const MAX_OFFSET_PX = 72
const TRIGGER_PX = 48
const AXIS_LOCK_PX = 8

export function useSwipeToReply(onReply: () => void, disabled?: boolean) {
    const [offset, setOffset] = useState(0)
    const start = useRef<{ x: number; y: number } | null>(null)
    const axis = useRef<'x' | 'y' | null>(null)

    function onTouchStart(e: React.TouchEvent) {
        if (disabled) return
        const t = e.touches[0]
        if (!t) return
        start.current = { x: t.clientX, y: t.clientY }
        axis.current = null
    }

    function onTouchMove(e: React.TouchEvent) {
        if (disabled || !start.current) return
        const t = e.touches[0]
        if (!t) return
        const dx = t.clientX - start.current.x
        const dy = t.clientY - start.current.y

        if (!axis.current) {
            if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
            axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        }
        if (axis.current !== 'x') return

        e.preventDefault()
        const clamped = Math.min(0, Math.max(-MAX_OFFSET_PX, dx))
        setOffset(clamped)
    }

    function onTouchEnd() {
        if (offset <= -TRIGGER_PX) onReply()
        setOffset(0)
        start.current = null
        axis.current = null
    }

    return {
        offset,
        handlers: {
            onTouchStart,
            onTouchMove,
            onTouchEnd,
            onTouchCancel: onTouchEnd,
        },
    }
}
