import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'

let io: Server | null = null

export function createSocketServer(app: express.Application) {
    const httpServer = createServer(app)

    io = new Server(httpServer, {
        cors: { origin: process.env.APP_URL }
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
        })

        socket.on('join:dm', (conversationId: string) => {
            socket.join(`dm:${conversationId}`)
        })

        socket.on('join:community', (communityId: string) => {
            socket.join(`community:${communityId}`)
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

        socket.on('leave:profile', (userId: string) => {
            socket.leave(`profile:${userId}`)
        })

        socket.on('disconnect', () => {
            console.log('client disconnected:', socket.id)
        })
    })

    return httpServer
}

export function getIO() {
    if (!io) throw new Error('Socket not initialized')
        return io
}
