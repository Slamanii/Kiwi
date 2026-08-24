'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getSocketUrl } from '@/lib/socketUrl'

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode}) {
    const { user } = useAuth()
    const socketRef = useRef<Socket | null>(null)
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        if (!user) return

        const s = io(getSocketUrl(), {
            auth: { token: localStorage.getItem('accessToken') }
        })
        s.on('connect', () => {
            s.emit('join:user', user.id)
        })

        socketRef.current = s
        setSocket(s)

        return () => {
            s.emit('leave:user', user.id)
            s.disconnect()
        }
    }, [user])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)