'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api/auth'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default function LoginPage() {
    const router       = useRouter()
    const { login }    = useAuth()

    const [email,    setEmail]    = useState('')
    const [password, setPassword] = useState('')
    const [error,    setError]    = useState('')
    const [loading,  setLoading]  = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await authApi.login(email, password)
            const { accessToken, refreshToken } = res.data
            await login(accessToken, refreshToken)
            router.replace('/feed')
        } catch (err: any) {
            const apiError = err?.response?.data?.error
            setError(typeof apiError === 'string' ? apiError : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm space-y-8">

                {/* Logo */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Kasa</h1>
                    <p className="mt-1 text-sm text-white/40">Find your space</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                px-4 py-3.5 text-sm text-white placeholder-white/30
                                focus:outline-none focus:border-cyan-400/50 transition-colors"
                        />
                        <PasswordInput
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                px-4 py-3.5 text-sm text-white placeholder-white/30
                                focus:outline-none focus:border-cyan-400/50 transition-colors"
                        />
                    </div>

                    <div className="text-right -mt-1">
                        <Link href="/forgot-password" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-400 text-black font-semibold text-sm
                            py-3.5 rounded-2xl active:opacity-80 transition-opacity
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className="text-center text-sm text-white/40">
                    No account?{' '}
                    <Link href="/register" className="text-cyan-400 font-medium">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    )
}