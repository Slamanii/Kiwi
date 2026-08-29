'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useChatUnread } from '@/context/ChatUnreadContext'
import { orderApi } from '@/lib/api/order'
import type { Message, StoreConversation } from '@/types'

function appendUnique(prev: Message[], message: Message) {
    return prev.some(m => m.id === message.id) ? prev : [...prev, message]
}

type MessageDeletedPayload = { conversationType: string; conversationId: string; messageIds: string[] }
type MessageUpdatedPayload = { conversationType: string; conversationId: string; message: Message }

function applyMessageDeleted(prev: Message[], payload: MessageDeletedPayload) {
    const ids = new Set(payload.messageIds)
    return prev.map(m => ids.has(m.id) ? { ...m, deleted: true, content: undefined } : m)
}

function applyMessagePatched(prev: Message[], payload: MessageUpdatedPayload) {
    return prev.map(m => m.id === payload.message.id ? { ...m, ...payload.message } : m)
}

function applyMessageArchived(prev: Message[], payload: MessageUpdatedPayload) {
    return prev.filter(m => m.id !== payload.message.id)
}

export function useOrderConversation(conversationId: string) {
    const [conversation, setConversation] = useState<StoreConversation | null>(null)
    const [messages,     setMessages]     = useState<Message[]>([])
    const [cursor,       setCursor]       = useState<string | null>(null)
    const [hasMore,      setHasMore]      = useState(true)
    const [loading,      setLoading]      = useState(true)
    const [loadingMore,  setLoadingMore]  = useState(false)
    const [sending,      setSending]      = useState(false)
    const socket = useSocket()
    const { refreshUnreadCount } = useChatUnread()

    useEffect(() => {
        if (!conversationId) return
        setLoading(true)
        orderApi.getConversationMessages(conversationId)
            .then(res => {
                setConversation(res.data.conversation)
                setMessages(res.data.messages.reverse())
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
        orderApi.markRead(conversationId).then(refreshUnreadCount).catch(console.error)
    }, [conversationId, refreshUnreadCount])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await orderApi.getConversationMessages(conversationId, cursor)
            setMessages(prev => [...res.data.messages.reverse(), ...prev])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, conversationId])

    const sendMessage = useCallback(async (content: string, replyToId?: string) => {
        if (!content.trim() || sending) return
        setSending(true)
        try {
            const res = await orderApi.sendConversationMessage(conversationId, content, replyToId)
            setMessages(prev => appendUnique(prev, res.data))
        } catch (err) {
            throw err
        } finally {
            setSending(false)
        }
    }, [conversationId, sending])

    useEffect(() => {
        if (!socket || !conversationId) return
        socket.emit('join:order', conversationId)
        return () => { socket.emit('leave:order', conversationId) }
    }, [socket, conversationId])

    useEffect(() => {
        if (!socket) return
        const onMessage = (message: Message) => {
            if (message.conversationId !== conversationId) return
            setMessages(prev => appendUnique(prev, message))
            orderApi.markRead(conversationId).then(refreshUnreadCount).catch(console.error)
        }
        const onDeleted = (payload: MessageDeletedPayload) => {
            if (payload.conversationType !== 'ORDER' || payload.conversationId !== conversationId) return
            setMessages(prev => applyMessageDeleted(prev, payload))
        }
        const onPinned = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'ORDER' || payload.conversationId !== conversationId) return
            setMessages(prev => applyMessagePatched(prev, payload))
        }
        const onArchived = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'ORDER' || payload.conversationId !== conversationId) return
            setMessages(prev => applyMessageArchived(prev, payload))
        }
        socket.on('message:new', onMessage)
        socket.on('message:deleted', onDeleted)
        socket.on('message:pinned', onPinned)
        socket.on('message:unpinned', onPinned)
        socket.on('message:archived', onArchived)
        return () => {
            socket.off('message:new', onMessage)
            socket.off('message:deleted', onDeleted)
            socket.off('message:pinned', onPinned)
            socket.off('message:unpinned', onPinned)
            socket.off('message:archived', onArchived)
        }
    }, [socket, conversationId, refreshUnreadCount])

    return { conversation, messages, loading, loadingMore, hasMore, loadMore, sendMessage, sending }
}
