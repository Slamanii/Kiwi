'use client'

import { useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

type SearchResult = {
    id: string
    name: string
    roles: string[]
    profile?: { avatarUrl?: string | null; verificationStatus?: string | null } | null
}

export default function AdminManageAdminsPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [busyId, setBusyId] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        setLoading(true)
        try {
            const res = await adminApi.searchUsers(query.trim())
            setResults(res.data)
        } finally {
            setLoading(false)
        }
    }

    const handlePromote = async (id: string) => {
        if (!window.confirm('Grant this user admin access?')) return
        setBusyId(id)
        try {
            await adminApi.promoteUser(id)
            setResults(prev =>
                prev.map(u => (u.id === id ? { ...u, roles: [...u.roles, 'ADMIN'] } : u))
            )
        } catch (err: any) {
            alert(err.response?.data?.error ?? 'Could not promote user')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="space-y-5">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users by name..."
                    className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5
                        text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="space-y-2">
                {results.map(user => {
                    const isAdmin = user.roles.includes('ADMIN')
                    return (
                        <div key={user.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs shrink-0">
                                    {user.profile?.avatarUrl ? (
                                        <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        user.name[0]
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="flex items-center gap-1.5 text-sm font-medium truncate">
                                        {user.name}
                                        {user.profile?.verificationStatus === 'VERIFIED' && (
                                            <VerifiedBadge size="xs" />
                                        )}
                                    </p>
                                    <p className="text-white/40 text-xs truncate">{user.roles.join(', ')}</p>
                                </div>
                            </div>
                            {isAdmin ? (
                                <span className="shrink-0 px-4 py-2 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 text-sm font-medium">
                                    Admin
                                </span>
                            ) : (
                                <button
                                    onClick={() => handlePromote(user.id)}
                                    disabled={busyId === user.id}
                                    className="shrink-0 px-4 py-2 rounded-full bg-blue-500 text-sm font-medium disabled:opacity-40"
                                >
                                    {busyId === user.id ? 'Promoting...' : 'Promote'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
