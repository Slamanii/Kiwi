'use client'

import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'

// Joins a conversation-scoped room (thread/dm/community/order) and rejoins it
// on every socket reconnect — server-side room membership is tied to the
// underlying transport connection and is silently dropped on any reconnect
// (network blip, backgrounding, wifi/cellular handoff), so without this a
// client can sit in a "joined" room that no longer receives anything.
export function useSocketRoom(socket: Socket | null, joinEvent: string, leaveEvent: string, room: string | null | undefined) {
    useEffect(() => {
        if (!socket || !room) return

        const join = () => socket.emit(joinEvent, room)
        join()
        socket.on('connect', join)

        return () => {
            socket.off('connect', join)
            socket.emit(leaveEvent, room)
        }
    }, [socket, joinEvent, leaveEvent, room])
}
