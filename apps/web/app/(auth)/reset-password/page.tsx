'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { PasswordInput } from '@/components/ui/PasswordInput'

function ResetPasswordForm() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') ?? ''
    const token = searchParams.get('token') ?? ''

    const [password,        setPassword]        = useState('')
    const [confirmPassword, setConfirmPassword]  = useState('')
    const [done,    setDone]    = useState(false)
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)

    const missingLink = !email || !token

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await authApi.resetPassword(email, token, password)
            setDone(true)
        } catch (err: any) {
            const apiError = err?.response?.data?.error
            setError(typeof apiError === 'string' ? apiError : 'Reset link is invalid or expired')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">New password</h1>
                    <p className="mt-1 text-sm text-white/40">
                        {done ? 'Password updated' : `Resetting password for ${email || 'your account'}`}
                    </p>
                </div>

                {missingLink && !done && (
                    <p className="text-center text-red-400 text-xs">
                        This reset link is missing or invalid. Request a new one.
                    </p>
                )}

                {done ? (
                    <button
                        onClick={() => router.replace('/login')}
                        className="w-full bg-cyan-400 text-black font-semibold text-sm
                            py-3.5 rounded-2xl active:opacity-80 transition-opacity"
                    >
                        Back to sign in
                    </button>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <PasswordInput
                                placeholder="New password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                    px-4 py-3.5 text-sm text-white placeholder-white/30
                                    focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                            <PasswordInput
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                    px-4 py-3.5 text-sm text-white placeholder-white/30
                                    focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || missingLink}
                            className="w-full bg-cyan-400 text-black font-semibold text-sm
                                py-3.5 rounded-2xl active:opacity-80 transition-opacity
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetting…' : 'Reset password'}
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm />
        </Suspense>
    )
}
