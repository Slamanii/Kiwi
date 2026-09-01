'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from '@/components/ui/Icons'

export default function PremiumPage() {
    const router = useRouter()

    return (
        <div className="min-h-full flex flex-col">
            <div className="flex items-center gap-3 px-4 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <span className="text-4xl mb-3">⭐</span>
                <h1 className="text-lg font-semibold text-white">Go Premium coming soon</h1>
                <p className="mt-1 text-sm text-white/40">Still under construction.</p>
            </div>
        </div>
    )
}
