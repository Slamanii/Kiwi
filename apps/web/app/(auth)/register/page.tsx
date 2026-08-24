'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api/auth'
import { PasswordInput } from '@/components/ui/PasswordInput'

const ROLES = [
    { value: 'SEEKER',   label: 'Seeker',           desc: 'Looking to rent or buy' },
    { value: 'AGENT',    label: 'Agent',             desc: 'Licensed real estate agent' },
    { value: 'MANAGER',  label: 'Manager',           desc: 'Property manager / developer' },
    { value: 'DESIGNER', label: 'Interior Designer', desc: 'Post-deal design services' },
]

export default function RegisterPage() {
    const router    = useRouter()
    const { login } = useAuth()

    const [step,     setStep]     = useState<1 | 2>(1)
    const [name,     setName]     = useState('')
    const [email,    setEmail]    = useState('')
    const [phone,    setPhone]    = useState('')
    const [password, setPassword] = useState('')
    const [role,     setRole]     = useState('SEEKER')
    const [error,    setError]    = useState('')
    const [loading,  setLoading]  = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await authApi.register({ name, email, password, phone: phone || undefined })
            const { accessToken, refreshToken } = res.data
            await login(accessToken, refreshToken)
            router.replace('/feed')
        } catch (err: any) {
            const apiError = err?.response?.data?.error
            setError(typeof apiError === 'string' ? apiError : 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm space-y-8">

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Kasa</h1>
                    <p className="mt-1 text-sm text-white/40">Create your account</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-4">
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Full name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                    px-4 py-3.5 text-sm text-white placeholder-white/30
                                    focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                    px-4 py-3.5 text-sm text-white placeholder-white/30
                                    focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                            <input
                                type="tel"
                                placeholder="Phone (optional)"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                    px-4 py-3.5 text-sm text-white placeholder-white/30
                                    focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                            <PasswordInput
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full bg-[#1c1c1e] border border-white/8 rounded-2xl
                                    px-4 py-3.5 text-sm text-white placeholder-white/30
                                    focus:outline-none focus:border-cyan-400/50 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-cyan-400 text-black font-semibold text-sm
                                py-3.5 rounded-2xl active:opacity-80 transition-opacity"
                        >
                            Continue
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <p className="text-sm text-white/50 text-center">I am a…</p>
                        <div className="space-y-2">
                            {ROLES.map(r => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                                        border transition-colors text-left
                                        ${role === r.value
                                            ? 'border-cyan-400/60 bg-cyan-400/8'
                                            : 'border-white/8 bg-[#1c1c1e]'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors
                                        ${role === r.value ? 'border-cyan-400 bg-cyan-400' : 'border-white/30'}`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">{r.label}</p>
                                        <p className="text-xs text-white/40">{r.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs text-center">{error}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 border border-white/10 text-white/60 text-sm
                                    font-medium py-3.5 rounded-2xl active:opacity-70"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-2 flex-grow bg-cyan-400 text-black font-semibold text-sm
                                    py-3.5 rounded-2xl active:opacity-80 disabled:opacity-50"
                            >
                                {loading ? 'Creating…' : 'Create account'}
                            </button>
                        </div>
                    </form>
                )}

                <p className="text-center text-sm text-white/40">
                    Have an account?{' '}
                    <Link href="/login" className="text-cyan-400 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}