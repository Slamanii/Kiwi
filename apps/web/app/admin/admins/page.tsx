'use client'

import { useState } from 'react'
import { adminApi } from '@/lib/api/admin'

type SearchResult = {
    id: string
    name: string
    roles: string[]
    avatarUrl?: string
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
                        <div key={user.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        user.name[0]
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-white/40 text-xs">{user.roles.join(', ')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePromote(user.id)}
                                disabled={isAdmin || busyId === user.id}
                                className="px-4 py-2 rounded-full bg-blue-500 text-sm font-medium disabled:opacity-40"
                            >
                                {isAdmin ? 'Admin' : 'Promote'}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
