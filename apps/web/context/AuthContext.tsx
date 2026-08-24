'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../types/index.js'
import { profileApi } from '../lib/api/profile'

export type AuthContextType = {
    user: User | null
    loading: boolean
    login: (accessToken: string, refreshToken: string) => Promise<void>
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            profileApi.getMe()
                .then(res => setUser(res.data))
                .catch(() => localStorage.clear())
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])
    const login = async (accessToken: string, refreshToken: string) => {
    // cookies for middleware route protection
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 30}`
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}`
    // localStorage for AuthContext hydration on refresh
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const res = await profileApi.getMe()
    setUser(res.data)
}

   const logout = () => {
    localStorage.clear()
    document.cookie = 'accessToken=; path=/; max-age=0'
    document.cookie = 'refreshToken=; path=/; max-age=0'
    setUser(null)
    window.location.href = '/login'
}

    const refreshUser = async () => {
        const res = await profileApi.getMe()
        setUser(res.data)
    } 


    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}


export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
        return ctx
}