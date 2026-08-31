export const STATUS_STYLES = {
    PENDING: {
        tabActive: 'bg-amber-400 text-black',
        badge: 'bg-amber-400/15 text-amber-300 border border-amber-400/30',
        dot: 'bg-amber-400',
    },
    APPROVED: {
        tabActive: 'bg-emerald-400 text-black',
        badge: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30',
        dot: 'bg-emerald-400',
    },
    REJECTED: {
        tabActive: 'bg-red-400 text-black',
        badge: 'bg-red-400/15 text-red-300 border border-red-400/30',
        dot: 'bg-red-400',
    },
} as const
