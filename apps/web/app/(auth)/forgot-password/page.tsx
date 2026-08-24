'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'

export default function ForgotPasswordPage() {
    const [email,   setEmail]   = useState('')
    const [sent,    setSent]    = useState(false)
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await authApi.requestPasswordReset(email)
            setSent(true)
        } catch (err: any) {
            const apiError = err?.response?.data?.error
            setError(typeof apiError === 'string' ? apiError : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reset password</h1>
                    <p className="mt-1 text-sm text-white/40">
                        {sent ? "Check your inbox" : "We'll email you a reset link"}
                    </p>
                </div>

                {sent ? (
                    <p className="text-center text-sm text-white/60">
                        If an account exists for <span className="text-white">{email}</span>, a reset link is on its way.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            {loading ? 'Sending…' : 'Send reset link'}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-white/40">
                    <Link href="/login" className="text-cyan-400 font-medium">
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
