import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'
import { prisma } from '@kiwi/db'

let io: Server | null = null

// counts concurrent sockets per user (multi-tab/device) so presence only
// flips offline once the last connection actually drops
const onlineCounts = new Map<string, number>()

type TypingPayload = {
    toUserId?: string // required for thread/dm, unused for community (broadcasts to the community room instead)
    fromUserId: string
    context: { kind: 'thread' | 'dm' | 'community'; id: string }
}

type CallInvitePayload = {
    callId: string
    toUserId: string
    fromUserId: string
    fromName: string
    fromAvatarUrl?: string | null
    fromVerified?: boolean
    kind: 'audio' | 'video'
}

type CallSignalPayload = {
    callId: string
    toUserId: string
    fromUserId: string
}

type CallSDPPayload = CallSignalPayload & {
    sdp: unknown
}

type CallIceCandidatePayload = CallSignalPayload & {
    candidate: unknown
}

export function createSocketServer(app: express.Application) {
    const httpServer = createServer(app)

    io = new Server(httpServer, {
        cors: { origin: process.env.NODE_ENV === 'production' ? process.env.APP_URL : true }
    })

    io.on('connection', (socket) => {
        console.log('client connected:', socket.id)

        // joins
        socket.on('join:seek', (seekId: string) => {
            socket.join(`seek:${seekId}`)
        })

        socket.on('join:thread', (threadId: string) => {
            socket.join(`thread:${threadId}`)
        })

        socket.on('join:user', (userId: string) => {
            socket.join(`user:${userId}`)
            socket.data.userId = userId

            const count = (onlineCounts.get(userId) ?? 0) + 1
            onlineCounts.set(userId, count)
            if (count === 1) {
                io!.emit('presence:update', { userId, online: true, lastSeenAt: null })
            }
        })

        socket.on('presence:get', (userId: string, callback: (data: { online: boolean; lastSeenAt: string | null }) => void) => {
            if ((onlineCounts.get(userId) ?? 0) > 0) {
                callback({ online: true, lastSeenAt: null })
                return
            }
            prisma.user.findUnique({ where: { id: userId }, select: { lastSeenAt: true } })
                .then(u => callback({ online: false, lastSeenAt: u?.lastSeenAt?.toISOString() ?? null }))
                .catch(() => callback({ online: false, lastSeenAt: null }))
        })

        socket.on('typing:start', (payload: TypingPayload) => relayTyping(socket, payload, true))
        socket.on('typing:stop', (payload: TypingPayload) => relayTyping(socket, payload, false))

        socket.on('join:dm', (conversationId: string) => {
            socket.join(`dm:${conversationId}`)
        })

        socket.on('join:community', (communityId: string) => {
            socket.join(`community:${communityId}`)
        })

        socket.on('join:order', (conversationId: string) => {
            socket.join(`order:${conversationId}`)
        })

        socket.on('join:profile', (userId: string) => {
            socket.join(`profile:${userId}`)
        })

        // leaves
        socket.on('leave:seek', (seekId: string) => {
            socket.leave(`seek:${seekId}`)
        })

        socket.on('leave:thread', (threadId: string) => {
            socket.leave(`thread:${threadId}`)
        })

        socket.on('leave:user', (userId: string) => {
            socket.leave(`user:${userId}`)
        })

        socket.on('leave:dm', (conversationId: string) => {
            socket.leave(`dm:${conversationId}`)
        })

        socket.on('leave:community', (communityId: string) => {
            socket.leave(`community:${communityId}`)
        })

        socket.on('leave:order', (conversationId: string) => {
            socket.leave(`order:${conversationId}`)
        })

        socket.on('leave:profile', (userId: string) => {
            socket.leave(`profile:${userId}`)
        })

        // WebRTC call signaling — the server only relays opaque payloads between
        // the caller's and callee's `user:${id}` rooms; it never inspects SDP/ICE
        // contents. A user's room can hold multiple sockets (multi-tab/device), so
        // an invite rings every device, and accept/decline relays a `call:cancelled`
        // back into the callee's own room (excluding the responding socket, which
        // socket.to() already does) to stop the other devices from ringing.
        socket.on('call:invite', (payload: CallInvitePayload) => {
            const room = `user:${payload.toUserId}`
            const recipients = io!.sockets.adapter.rooms.get(room)
            if (!recipients || recipients.size === 0) {
                socket.emit('call:unavailable', { callId: payload.callId, toUserId: payload.toUserId })
                return
            }
            socket.to(room).emit('call:invite', payload)
        })

        socket.on('call:accept', (payload: CallSignalPayload) => {
            socket.to(`user:${payload.toUserId}`).emit('call:accept', payload)
            socket.to(`user:${payload.fromUserId}`).emit('call:cancelled', { callId: payload.callId })
        })

        socket.on('call:decline', (payload: CallSignalPayload) => {
            socket.to(`user:${payload.toUserId}`).emit('call:decline', payload)
            socket.to(`user:${payload.fromUserId}`).emit('call:cancelled', { callId: payload.callId })
        })

        socket.on('call:end', (payload: CallSignalPayload) => {
            socket.to(`user:${payload.toUserId}`).emit('call:end', payload)
        })

        socket.on('call:offer', (payload: CallSDPPayload) => {
            socket.to(`user:${payload.toUserId}`).emit('call:offer', payload)
        })

        socket.on('call:answer', (payload: CallSDPPayload) => {
            socket.to(`user:${payload.toUserId}`).emit('call:answer', payload)
        })

        socket.on('call:ice-candidate', (payload: CallIceCandidatePayload) => {
            socket.to(`user:${payload.toUserId}`).emit('call:ice-candidate', payload)
        })

        socket.on('disconnect', () => {
            console.log('client disconnected:', socket.id)

            const userId = socket.data.userId as string | undefined
            if (!userId) return

            const count = (onlineCounts.get(userId) ?? 1) - 1
            if (count <= 0) {
                onlineCounts.delete(userId)
                const lastSeenAt = new Date()
                io!.emit('presence:update', { userId, online: false, lastSeenAt: lastSeenAt.toISOString() })
                prisma.user.update({ where: { id: userId }, data: { lastSeenAt } }).catch(() => {})
            } else {
                onlineCounts.set(userId, count)
            }
        })
    })

    return httpServer
}

function relayTyping(socket: import('socket.io').Socket, payload: TypingPayload, typing: boolean) {
    const room = payload.context.kind === 'community'
        ? `community:${payload.context.id}`
        : payload.toUserId ? `user:${payload.toUserId}` : null
    if (!room) return
    socket.to(room).emit('typing:update', { fromUserId: payload.fromUserId, context: payload.context, typing })
}

export function getIO() {
    if (!io) throw new Error('Socket not initialized')
        return io
}
