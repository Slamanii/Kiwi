'use client'
import { useEffect, useState, useRef } from 'react'

export function useScrollDirection() {
    const [hidden, setHidden] = useState(false)
    const lastY = useRef(0)

    useEffect(() => {
        const el = document.getElementById('main-scroll')
        if (!el) return

        const onScroll = () => {
            const currentY = el.scrollTop
            setHidden(currentY > lastY.current && currentY > 50)
            lastY.current = currentY
        }

        el.addEventListener('scroll', onScroll, { passive: true })
        return () => el.removeEventListener('scroll', onScroll)
    }, [])

    return hidden
    
}