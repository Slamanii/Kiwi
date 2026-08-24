'use client'

import { useState, useEffect } from 'react'
import { orderApi } from '@/lib/api/order'
import type { StoreConversation } from '@/types'

// getMyStoreConversations has no pagination on the backend today — it returns every
// conversation the buyer has open in one shot, so there's no cursor to track here
export function useOrderConversations() {
    const [conversations, setConversations] = useState<StoreConversation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        orderApi.getMyConversations()
            .then(res => setConversations(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return { conversations, loading }
}
