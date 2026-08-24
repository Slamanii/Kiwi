'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSocket } from '@/context/SocketContext'

type TypingContext = { kind: 'thread' | 'dm' | 'community' | 'order'; id: string }
type TypingUpdate = { fromUserId: string; context: TypingContext; typing: boolean }

const STOP_DELAY_MS = 2500

// Emits typing:start/stop for the conversation currently open in ConversationView.
export function useTypingEmitter(fromUserId: string, toUserId: string | undefined, context: TypingContext | undefined) {
    const socket = useSocket()
    const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isTypingRef = useRef(false)

    const notifyTyping = useCallback(() => {
        if (!socket || !context) return
        if (!isTypingRef.current) {
            isTypingRef.current = true
            socket.emit('typing:start', { toUserId, fromUserId, context })
        }
        if (stopTimer.current) clearTimeout(stopTimer.current)
        stopTimer.current = setTimeout(() => {
            isTypingRef.current = false
            socket.emit('typing:stop', { toUserId, fromUserId, context })
        }, STOP_DELAY_MS)
    }, [socket, toUserId, fromUserId, context])

    const notifyStopped = useCallback(() => {
        if (!socket || !context) return
        if (stopTimer.current) clearTimeout(stopTimer.current)
        if (isTypingRef.current) {
            isTypingRef.current = false
            socket.emit('typing:stop', { toUserId, fromUserId, context })
        }
    }, [socket, toUserId, fromUserId, context])

    useEffect(() => () => { if (stopTimer.current) clearTimeout(stopTimer.current) }, [])

    return { notifyTyping, notifyStopped }
}

// Listens for the peer typing in the conversation currently open in ConversationView.
export function usePeerTyping(peerId: string | undefined) {
    const socket = useSocket()
    const [typing, setTyping] = useState(false)

    useEffect(() => {
        if (!socket || !peerId) return
        function onUpdate(update: TypingUpdate) {
            if (update.fromUserId !== peerId) return
            setTyping(update.typing)
        }
        socket.on('typing:update', onUpdate)
        return () => { socket.off('typing:update', onUpdate) }
    }, [socket, peerId])

    return typing
}

// Tracks which thread/dm rows in the inbox list currently have the peer typing.
export function useTypingList(kind: 'thread' | 'dm') {
    const socket = useSocket()
    const [typingIds, setTypingIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!socket) return
        function onUpdate(update: TypingUpdate) {
            if (update.context.kind !== kind) return
            setTypingIds(prev => {
                const next = new Set(prev)
                if (update.typing) next.add(update.context.id)
                else next.delete(update.context.id)
                return next
            })
        }
        socket.on('typing:update', onUpdate)
        return () => { socket.off('typing:update', onUpdate) }
    }, [socket, kind])

    return typingIds
}
