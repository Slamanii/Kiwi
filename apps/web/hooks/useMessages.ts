'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useSocketRoom } from '@/hooks/useSocketRoom'
import { useChatUnread } from '@/context/ChatUnreadContext'
import { messageApi } from '@/lib/api/message'
import type { Message } from '@/types'
import type { SendMessageInput } from '@kiwi/types'

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

export function useMessages(threadId: string) {
    const [messages,    setMessages]    = useState<Message[]>([])
    const [cursor,      setCursor]      = useState<string | null>(null)
    const [hasMore,     setHasMore]     = useState(true)
    const [loading,     setLoading]     = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [sending,     setSending]     = useState(false)
    const socket = useSocket()
    const { refreshUnreadCount } = useChatUnread()

    useEffect(() => {
        if (!threadId) return
        setLoading(true)
        messageApi.getThreadMessages(threadId)
            .then(res => {
                setMessages(res.data.messages.reverse())
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
        messageApi.markRead(threadId).then(refreshUnreadCount).catch(console.error)
    }, [threadId, refreshUnreadCount])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await messageApi.getThreadMessages(threadId, cursor)
            setMessages(prev => [...res.data.messages.reverse(), ...prev])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, threadId])

    const sendMessage = useCallback(async (input: SendMessageInput) => {
        if (!(input.content?.trim() || input.mediaUrl) || sending) return
        setSending(true)
        try {
            const res = await messageApi.sendToThread(threadId, input)
            setMessages(prev => appendUnique(prev, res.data))
        } catch (err) {
            throw err
        } finally {
            setSending(false)
        }
    }, [threadId, sending])

    useEffect(() => {
        if (!socket) return
        const onMessage = (message: Message) => {
            if (message.threadId !== threadId) return
            setMessages(prev => appendUnique(prev, message))
            messageApi.markRead(threadId).then(refreshUnreadCount).catch(console.error)
        }
        const onDeleted = (payload: MessageDeletedPayload) => {
            if (payload.conversationType !== 'THREAD' || payload.conversationId !== threadId) return
            setMessages(prev => applyMessageDeleted(prev, payload))
        }
        const onPinned = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'THREAD' || payload.conversationId !== threadId) return
            setMessages(prev => applyMessagePatched(prev, payload))
        }
        const onArchived = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'THREAD' || payload.conversationId !== threadId) return
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
    }, [socket, threadId, refreshUnreadCount])

    return { messages, loading, loadingMore, hasMore, loadMore, sendMessage, sending }
}

export function useDMMessages(userId: string) {
    const [messages,       setMessages]       = useState<Message[]>([])
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [cursor,         setCursor]         = useState<string | null>(null)
    const [hasMore,        setHasMore]        = useState(true)
    const [loading,        setLoading]        = useState(true)
    const [loadingMore,    setLoadingMore]    = useState(false)
    const [sending,        setSending]        = useState(false)
    const socket = useSocket()
    const { refreshUnreadCount } = useChatUnread()

    useEffect(() => {
        if (!userId) return
        setLoading(true)
        messageApi.getDMMessages(userId)
            .then(res => {
                setMessages(res.data.messages.reverse())
                setConversationId(res.data.conversationId ?? null)
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
                if (res.data.conversationId) {
                    messageApi.markDMRead(res.data.conversationId).then(refreshUnreadCount).catch(console.error)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [userId, refreshUnreadCount])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await messageApi.getDMMessages(userId, cursor)
            setMessages(prev => [...res.data.messages.reverse(), ...prev])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, userId])

    const sendMessage = useCallback(async (input: SendMessageInput) => {
        if (!(input.content?.trim() || input.mediaUrl) || sending) return
        setSending(true)
        try {
            const res = await messageApi.sendDM(userId, input)
            setMessages(prev => appendUnique(prev, res.data))
            setConversationId(prev => prev ?? (res.data as Message & { conversationId?: string }).conversationId ?? null)
        } catch (err) {
            throw err
        } finally {
            setSending(false)
        }
    }, [userId, sending])

    useSocketRoom(socket, 'join:dm', 'leave:dm', conversationId)

    useEffect(() => {
        if (!socket) return
        const onMessage = (message: Message & { conversationId?: string }) => {
            if (!conversationId || message.conversationId !== conversationId) return
            setMessages(prev => appendUnique(prev, message))
            messageApi.markDMRead(conversationId).then(refreshUnreadCount).catch(console.error)
        }
        const onDeleted = (payload: MessageDeletedPayload) => {
            if (payload.conversationType !== 'DM' || payload.conversationId !== conversationId) return
            setMessages(prev => applyMessageDeleted(prev, payload))
        }
        const onPinned = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'DM' || payload.conversationId !== conversationId) return
            setMessages(prev => applyMessagePatched(prev, payload))
        }
        const onArchived = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'DM' || payload.conversationId !== conversationId) return
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

    return { messages, loading, loadingMore, hasMore, loadMore, sendMessage, sending, conversationId }
}


export function useCommunityMessages(communityId: string) {
    const [messages,    setMessages]    = useState<Message[]>([])
    const [cursor,      setCursor]      = useState<string | null>(null)
    const [hasMore,     setHasMore]     = useState(true)
    const [loading,     setLoading]     = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [sending,     setSending]     = useState(false)
    const socket = useSocket()

    useEffect(() => {
        if (!communityId) return
        setLoading(true)
        messageApi.getCommunityMessages(communityId)
            .then(res => {
                setMessages(res.data.messages.reverse())
                setCursor(res.data.nextCursor ?? null)
                setHasMore(!!res.data.nextCursor)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [communityId])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !cursor) return
        setLoadingMore(true)
        try {
            const res = await messageApi.getCommunityMessages(communityId, cursor)
            setMessages(prev => [...res.data.messages.reverse(), ...prev])
            setCursor(res.data.nextCursor ?? null)
            setHasMore(!!res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }, [hasMore, loadingMore, cursor, communityId])

    const sendMessage = useCallback(async (input: SendMessageInput) => {
        if (!(input.content?.trim() || input.mediaUrl) || sending) return
        setSending(true)
        try {
            const res = await messageApi.sendCommunityMessage(communityId, input)
            setMessages(prev => appendUnique(prev, res.data))
        } catch (err) {
            throw err
        } finally {
            setSending(false)
        }
    }, [communityId, sending])

    useSocketRoom(socket, 'join:community', 'leave:community', communityId)

    useEffect(() => {
        if (!socket) return
        const onMessage = (message: Message & { communityId?: string }) => {
            if (message.communityId !== communityId) return
            setMessages(prev => appendUnique(prev, message))
        }
        const onPollDeleted = ({ messageId }: { pollId: string; messageId?: string }) => {
            if (!messageId) return
            setMessages(prev => prev.filter(m => m.id !== messageId))
        }
        const onDeleted = (payload: MessageDeletedPayload) => {
            if (payload.conversationType !== 'COMMUNITY' || payload.conversationId !== communityId) return
            setMessages(prev => applyMessageDeleted(prev, payload))
        }
        const onPinned = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'COMMUNITY' || payload.conversationId !== communityId) return
            setMessages(prev => applyMessagePatched(prev, payload))
        }
        const onArchived = (payload: MessageUpdatedPayload) => {
            if (payload.conversationType !== 'COMMUNITY' || payload.conversationId !== communityId) return
            setMessages(prev => applyMessageArchived(prev, payload))
        }
        socket.on('message:new', onMessage)
        socket.on('poll:deleted', onPollDeleted)
        socket.on('message:deleted', onDeleted)
        socket.on('message:pinned', onPinned)
        socket.on('message:unpinned', onPinned)
        socket.on('message:archived', onArchived)
        return () => {
            socket.off('message:new', onMessage)
            socket.off('poll:deleted', onPollDeleted)
            socket.off('message:deleted', onDeleted)
            socket.off('message:pinned', onPinned)
            socket.off('message:unpinned', onPinned)
            socket.off('message:archived', onArchived)
        }
    }, [socket, communityId])

    return { messages, loading, loadingMore, hasMore, loadMore, sendMessage, sending }
}