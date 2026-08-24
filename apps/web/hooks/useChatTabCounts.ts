'use client'

import { useEffect, useState } from 'react'
import { threadApi } from '@/lib/api/thread'
import { messageApi } from '@/lib/api/message'
import { bidApi } from '@/lib/api/bid'
import { orderApi } from '@/lib/api/order'

export function useChatTabCounts() {
    const [counts, setCounts] = useState({ threads: 0, dm: 0, bids: 0, orders: 0 })

    useEffect(() => {
        let cancelled = false
        Promise.all([
            threadApi.getMyThreads().catch(() => ({ data: [] })),
            messageApi.getDMConversations().catch(() => ({ data: [] })),
            bidApi.getReceivedBids().catch(() => ({ data: [] })),
            orderApi.getMyConversations().catch(() => ({ data: [] })),
        ]).then(([threadsRes, dmRes, bidsRes, ordersRes]) => {
            if (cancelled) return
            setCounts({
                threads: (threadsRes.data ?? []).reduce((sum: number, t: { unreadCount?: number }) => sum + (t.unreadCount ?? 0), 0),
                dm: (dmRes.data ?? []).reduce((sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount ?? 0), 0),
                bids: (bidsRes.data ?? []).filter((b: { status: string }) => b.status === 'PENDING').length,
                orders: (ordersRes.data ?? []).reduce((sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount ?? 0), 0),
            })
        })
        return () => { cancelled = true }
    }, [])

    return counts
}
