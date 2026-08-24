'use client'

import { useCallback, useRef } from 'react'

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 10

export function useLongPress(onLongPress: () => void) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const start = useRef<{ x: number; y: number } | null>(null)

    const clear = useCallback(() => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = null
        start.current = null
    }, [])

    const begin = useCallback((x: number, y: number) => {
        start.current = { x, y }
        timer.current = setTimeout(() => {
            onLongPress()
            clear()
        }, LONG_PRESS_MS)
    }, [onLongPress, clear])

    const move = useCallback((x: number, y: number) => {
        if (!start.current) return
        const dx = Math.abs(x - start.current.x)
        const dy = Math.abs(y - start.current.y)
        if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clear()
    }, [clear])

    return {
        onMouseDown: (e: React.MouseEvent) => begin(e.clientX, e.clientY),
        onMouseMove: (e: React.MouseEvent) => move(e.clientX, e.clientY),
        onMouseUp: clear,
        onMouseLeave: clear,
        onTouchStart: (e: React.TouchEvent) => {
            const t = e.touches[0]
            if (t) begin(t.clientX, t.clientY)
        },
        onTouchMove: (e: React.TouchEvent) => {
            const t = e.touches[0]
            if (t) move(t.clientX, t.clientY)
        },
        onTouchEnd: clear,
        onTouchCancel: clear,
        onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault()
            clear()
            onLongPress()
        },
    }
}
