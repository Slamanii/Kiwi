import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { getSocketUrl } from '@/lib/socketUrl'


let socket: Socket | null = null

export function getSocket() {

    if (!socket) {
        socket = io(getSocketUrl(), {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        })
    }

    return socket
}

export function useSeekSocket(seekId: string, onBidCount: (count: number) => void) {
    useEffect(() => {
        const s = getSocket()
        s.emit('join:seek', seekId)
        s.on('bid:count', (data) => {
            if (data.seekId === seekId) onBidCount(data.bidCount)
        })

        return () => {
            s.off('bid:count')
            s.emit('leave:seek', seekId)
        }
    }, [seekId])
}

export function useThreadSocket(threadId: string, onMessage: (message: any) => void) {
    useEffect(() => {
        const s = getSocket()
        s.emit('join:thread', threadId)
        s.on('message:count', (data) => {
            if (data.threadId === threadId) onMessage(data.message)
        })

        return () => {
            s.off('message:count')
            s.emit('leave:thread', threadId)
        }
    }, [threadId])
}


export function useNotificationSocket(userId: string, onNotification: (notification: any) => void) {
  useEffect(() => {
    const s = getSocket()
    s.emit('join:user', userId)
    s.on('notification:new', onNotification)

    return () => {
      s.off('notification:new')
    }
  }, [userId])
}

export function useNewSeekSocket(onSeek: (seek: any) => void) {
  useEffect(() => {
    const s = getSocket()
    s.on('seek:new', onSeek)

    return () => {
      s.off('seek:new')
    }
  }, [])
}




////useSeekSocket(seek.id, (count) => setBidCount(count))