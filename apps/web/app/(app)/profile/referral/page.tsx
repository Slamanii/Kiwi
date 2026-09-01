'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { referralApi } from '@/lib/api/referral'
import { ChevronLeftIcon } from '@/components/ui/Icons'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

type ReferralStats = { total: number; paid: number; pending: number }

type ReferralEntry = {
    id: string
    paid: boolean
    paidAt: string | null
    createdAt: string
    referred: {
        id: string
        name: string
        profile?: { avatarUrl?: string | null; verificationStatus?: string | null } | null
    }
}

export default function ReferralPage() {
    const router = useRouter()
    const { user } = useAuth()

    const [stats,       setStats]       = useState<ReferralStats | null>(null)
    const [referrals,   setReferrals]   = useState<ReferralEntry[]>([])
    const [cursor,      setCursor]      = useState<string | null>(null)
    const [hasMore,     setHasMore]     = useState(false)
    const [loading,     setLoading]     = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [copied,      setCopied]      = useState(false)

    const load = useCallback(async (cursorParam?: string) => {
        const res = await referralApi.getMyReferrals(cursorParam)
        return res.data
    }, [])

    useEffect(() => {
        setLoading(true)
        Promise.all([referralApi.getStats(), load()])
            .then(([statsRes, data]) => {
                setStats(statsRes.data)
                setReferrals(data.referrals)
                setCursor(data.nextCursor ?? null)
                setHasMore(!!data.nextCursor)
            })
            .finally(() => setLoading(false))
    }, [load])

    const loadMore = async () => {
        if (!cursor || loadingMore) return
        setLoadingMore(true)
        try {
            const data = await load(cursor)
            setReferrals(prev => [...prev, ...data.referrals])
            setCursor(data.nextCursor ?? null)
            setHasMore(!!data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }

    const handleCopy = () => {
        if (!user?.referralCode) return
        navigator.clipboard.writeText(user.referralCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">
            <div className="flex items-center gap-3 px-4 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-lg font-semibold">Referral Code</h1>
            </div>

            <div className="px-4 space-y-5">
                <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-white/40 text-xs">Your referral code</p>
                        <p className="text-xl font-semibold tracking-wide mt-1">{user?.referralCode ?? '—'}</p>
                    </div>
                    <button
                        onClick={handleCopy}
                        disabled={!user?.referralCode}
                        className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium active:opacity-70 disabled:opacity-40"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

                {stats && (
                    <div className="grid grid-cols-3 gap-2">
                        <StatBox label="Total" value={stats.total} />
                        <StatBox label="Paid" value={stats.paid} />
                        <StatBox label="Pending" value={stats.pending} />
                    </div>
                )}

                <div className="space-y-3">
                    <h2 className="text-white/40 text-xs font-medium uppercase tracking-wide">People you referred</h2>
                    {loading ? (
                        <p className="text-white/25 text-sm text-center py-16">Loading...</p>
                    ) : referrals.length === 0 ? (
                        <p className="text-white/25 text-sm text-center py-16">No referrals yet. Share your code to start earning.</p>
                    ) : (
                        <>
                            {referrals.map(r => (
                                <div
                                    key={r.id}
                                    className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-4 py-3"
                                >
                                    <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                                        {r.referred.profile?.avatarUrl ? (
                                            <img src={r.referred.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white/50 text-sm">{r.referred.name?.[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="flex items-center gap-1.5 text-sm font-medium truncate">
                                            {r.referred.name}
                                            {r.referred.profile?.verificationStatus === 'VERIFIED' && (
                                                <VerifiedBadge size="xs" />
                                            )}
                                        </p>
                                        <p className="text-xs text-white/40">{new Date(r.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.paid ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-white/40'}`}>
                                        {r.paid ? 'Paid' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="w-full py-3 text-sm text-blue-400 disabled:opacity-40"
                                >
                                    {loadingMore ? 'Loading...' : 'Load more'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white/5 border border-white/8 rounded-2xl px-3 py-4 text-center">
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-white/40 text-xs mt-0.5">{label}</p>
        </div>
    )
}
