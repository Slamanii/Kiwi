// web/app/(app)/marketplace/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { MarketplaceList } from '../marketplace/marketplacelist'

export default function MarketplacePage() {
    const router = useRouter()
    return (
        <div className="min-h-full">
            <div className="flex items-center gap-3 px-4 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center active:opacity-70 text-white text-xl leading-none"
                    aria-label="Back"
                >
                    ‹
                </button>
                <h1 className="text-white text-xl font-bold">Marketplace</h1>
            </div>
            <MarketplaceList />
        </div>
    )
}