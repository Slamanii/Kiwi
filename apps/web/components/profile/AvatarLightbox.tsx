'use client'

import { ChevronLeftIcon } from '@/components/ui/Icons'

type AvatarLightboxProps = {
    src: string
    onClose: () => void
}

export function AvatarLightbox({ src, onClose }: AvatarLightboxProps) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-6"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-14 right-5 w-9 h-9 rounded-full bg-white/10
                           flex items-center justify-center text-white active:opacity-70"
                aria-label="Close"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <img
                src={src}
                alt=""
                className="max-w-full max-h-[80vh] rounded-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    )
}
