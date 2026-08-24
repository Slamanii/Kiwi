'use client'
import { useEffect } from 'react'

type SheetProps = {
    open: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
}

export function sheet({ open, onClose, title, children }: SheetProps) {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = ''}
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full bg-white rounded-t-2xl px-4 pt-4 pb-8 max-h-[90vh] overflow-y-auto">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                {title && <h3 className="text-base font-semibold mb-4">{title}</h3>}
                {children}
            </div>
        </div>
    )
}