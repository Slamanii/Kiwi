'use client'

import { useEffect, useRef, useState } from 'react'

const VIEWPORT = 280
const OUTPUT = 512

type AvatarCropModalProps = {
    file: File
    onCancel: () => void
    onConfirm: (blob: Blob) => void
}

export function AvatarCropModal({ file, onCancel, onConfirm }: AvatarCropModalProps) {
    const [imgUrl, setImgUrl] = useState<string | null>(null)
    const [natural, setNatural] = useState({ width: 0, height: 0 })
    const [zoom, setZoom] = useState(1)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

    useEffect(() => {
        const url = URL.createObjectURL(file)
        setImgUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    if (!imgUrl || natural.width === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                <img
                    src={imgUrl ?? undefined}
                    className="hidden"
                    onLoad={(e) => {
                        const el = e.currentTarget
                        setNatural({ width: el.naturalWidth, height: el.naturalHeight })
                    }}
                    alt=""
                />
                <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
        )
    }

    const baseScale = Math.max(VIEWPORT / natural.width, VIEWPORT / natural.height)
    const displayWidth = natural.width * baseScale * zoom
    const displayHeight = natural.height * baseScale * zoom
    const maxOffsetX = Math.max(0, (displayWidth - VIEWPORT) / 2)
    const maxOffsetY = Math.max(0, (displayHeight - VIEWPORT) / 2)

    const clamp = (x: number, y: number) => ({
        x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
        y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y)),
    })

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        setPos(clamp(dragRef.current.origX + dx, dragRef.current.origY + dy))
    }

    const handlePointerUp = () => {
        dragRef.current = null
    }

    const handleZoomChange = (nextZoom: number) => {
        setZoom(nextZoom)
        setPos((p) => clamp(p.x, p.y))
    }

    const handleConfirm = () => {
        const scale = baseScale * zoom
        const sourceSize = VIEWPORT / scale
        const imageLeft = VIEWPORT / 2 - displayWidth / 2 + pos.x
        const imageTop = VIEWPORT / 2 - displayHeight / 2 + pos.y
        const sourceLeft = -imageLeft / scale
        const sourceTop = -imageTop / scale

        const canvas = document.createElement('canvas')
        canvas.width = OUTPUT
        canvas.height = OUTPUT
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.onload = () => {
            ctx.drawImage(img, sourceLeft, sourceTop, sourceSize, sourceSize, 0, 0, OUTPUT, OUTPUT)
            canvas.toBlob((blob) => {
                if (blob) onConfirm(blob)
            }, 'image/jpeg', 0.9)
        }
        img.src = imgUrl
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-5 px-4">
            <div
                className="relative overflow-hidden touch-none select-none"
                style={{ width: VIEWPORT, height: VIEWPORT, borderRadius: '9999px' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <img
                    src={imgUrl}
                    alt=""
                    draggable={false}
                    className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                    style={{
                        width: displayWidth,
                        height: displayHeight,
                        transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                    }}
                />
                <div className="absolute inset-0 rounded-full ring-2 ring-white/60 pointer-events-none" />
            </div>

            <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-56"
            />

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium active:opacity-70"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    className="px-6 py-2.5 rounded-full bg-[#E97014] text-white text-sm font-semibold active:opacity-70"
                >
                    Save
                </button>
            </div>
        </div>
    )
}
