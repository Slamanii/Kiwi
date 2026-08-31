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

const CARDS: { key: keyof Stats; label: string; bar: string; text: string }[] = [
    { key: 'totalUsers', label: 'Total Users', bar: 'bg-indigo-400', text: 'text-indigo-300' },
    { key: 'totalSeeks', label: 'Total Seeks', bar: 'bg-violet-400', text: 'text-violet-300' },
    { key: 'activeThreads', label: 'Active Threads', bar: 'bg-cyan-400', text: 'text-cyan-300' },
    { key: 'closedThreads', label: 'Closed Threads', bar: 'bg-white/30', text: 'text-white/70' },
    { key: 'closedDeals', label: 'Closed Deals', bar: 'bg-emerald-400', text: 'text-emerald-300' },
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
                <div key={card.key} className="relative bg-white/5 rounded-2xl p-5 pl-6 overflow-hidden">
                    <span className={`absolute left-0 top-0 bottom-0 w-1 ${card.bar}`} />
                    <p className="text-white/50 text-xs mb-1">{card.label}</p>
                    <p className={`text-2xl font-semibold ${loading ? 'text-white' : card.text}`}>
                        {loading ? '—' : stats?.[card.key] ?? 0}
                    </p>
                </div>
            ))}
        </div>
    )
}
