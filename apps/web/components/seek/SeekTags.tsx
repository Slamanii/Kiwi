import { Seek } from '@/types'
import { currencySymbol } from '@/lib/currency'

export function SeekTags({ seek }: { seek: Seek }) {
    if (!seek.location && !seek.budget && !seek.urgency) return null

    return (
        <div className="flex flex-wrap gap-2">
            {seek.location && (
                <span className="flex items-center gap-1 text-xs text-gray-300 bg-white/10 px-2.5 py-1 rounded-full">
                    📍 {seek.location}
                </span>
            )}
            {seek.budget && (
                <span className="text-xs font-medium text-black bg-[#8CDF8C] px-2.5 py-1 rounded-full">
                    {currencySymbol(seek.currency)}{seek.budget.toLocaleString()}
                </span>
            )}
            {seek.urgency && seek.urgency !== 'NORMAL' && (
                <span className="text-xs text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full">
                    {seek.urgency.toLowerCase()}
                </span>
            )}
        </div>
    )
}