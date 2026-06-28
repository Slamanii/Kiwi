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
    

        socket.on('join:thread', (seekId: string) => {
            socket.join(`seek:${seekId}`)
        })

        socket.on('join:thread', (threadId: string) => {
            socket.join(`thread:${threadId}`)
        })

        socket.on('join:user', (userId: string) => {
            socket.join(`user:${userId}`)
        })

        ///for disconnections
        socket.on('leave:seek', (seekId: string) => {
         socket.leave(`seek:${seekId}`)
        })

        socket.on('leave:thread', (threadId: string) => {
         socket.leave(`thread:${threadId}`)
            })
        socket.on('disconnect', () => {
            console.log('client disconnected:', socket.id)
        })

        return httpServer
    })
}

export function getIO() {
    if (!io) throw new Error('Socket not initialized')
        return io
}
