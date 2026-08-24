'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'

type Stats = {
    totalUsers: number
    totalSeeks: number
    activeThreads: number
    closedThreads: number
    closedDeals: number
}

const CARDS: { key: keyof Stats; label: string }[] = [
    { key: 'totalUsers', label: 'Total Users' },
    { key: 'totalSeeks', label: 'Total Seeks' },
    { key: 'activeThreads', label: 'Active Threads' },
    { key: 'closedThreads', label: 'Closed Threads' },
    { key: 'closedDeals', label: 'Closed Deals' },
]

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        adminApi.getStats()
            .then(res => setStats(res.data))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {CARDS.map(card => (
                <div key={card.key} className="bg-white/5 rounded-2xl p-5">
                    <p className="text-white/50 text-xs mb-1">{card.label}</p>
                    <p className="text-2xl font-semibold">
                        {loading ? '—' : stats?.[card.key] ?? 0}
                    </p>
                </div>
            ))}
        </div>
    )
}
