'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'

type VerificationRequest = {
    id: string
    nin: string
    idType: string
    idNumber: string
    idDocumentUrl: string
    selfieUrl: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    rejectionReason?: string | null
    createdAt: string
    user: {
        id: string
        name: string
        email: string
        profile?: { avatarUrl?: string; location?: string }
    }
}

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED'] as const

export default function AdminVerificationsPage() {
    const [status, setStatus] = useState<typeof STATUS_TABS[number]>('PENDING')
    const [requests, setRequests] = useState<VerificationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<string | null>(null)

    const load = () => {
        setLoading(true)
        adminApi.getVerifications({ status })
            .then(res => setRequests(res.data.requests))
            .finally(() => setLoading(false))
    }

    useEffect(load, [status])

    const handleApprove = async (id: string) => {
        setBusyId(id)
        try {
            await adminApi.approveVerification(id)
            setRequests(prev => prev.filter(r => r.id !== id))
        } catch (err: any) {
            alert(err.response?.data?.error ?? 'Could not approve request')
        } finally {
            setBusyId(null)
        }
    }

    const handleReject = async (id: string) => {
        const reason = window.prompt('Rejection reason (optional):') ?? undefined
        setBusyId(id)
        try {
            await adminApi.rejectVerification(id, reason)
            setRequests(prev => prev.filter(r => r.id !== id))
        } catch (err: any) {
            alert(err.response?.data?.error ?? 'Could not reject request')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-1">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setStatus(tab)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                            status === tab ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                        }`}
                    >
                        {tab[0] + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-white/40 text-sm">Loading...</p>
            ) : requests.length === 0 ? (
                <p className="text-white/40 text-sm">No {status.toLowerCase()} verification requests.</p>
            ) : (
                <div className="space-y-3">
                    {requests.map(reqItem => (
                        <div key={reqItem.id} className="bg-white/5 rounded-2xl p-5 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{reqItem.user.name}</p>
                                    <p className="text-white/40 text-xs">{reqItem.user.email}</p>
                                </div>
                                <p className="text-white/40 text-xs">
                                    {new Date(reqItem.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-white/70">
                                <p>NIN: {reqItem.nin}</p>
                                <p>{reqItem.idType}: {reqItem.idNumber}</p>
                            </div>

                            <div className="flex gap-3">
                                <a
                                    href={reqItem.idDocumentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 text-sm underline"
                                >
                                    View ID document
                                </a>
                                <a
                                    href={reqItem.selfieUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 text-sm underline"
                                >
                                    View selfie
                                </a>
                            </div>

                            {reqItem.status === 'REJECTED' && reqItem.rejectionReason && (
                                <p className="text-red-400 text-xs">Reason: {reqItem.rejectionReason}</p>
                            )}

                            {reqItem.status === 'PENDING' && (
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => handleApprove(reqItem.id)}
                                        disabled={busyId === reqItem.id}
                                        className="flex-1 py-2.5 rounded-full bg-blue-500 text-sm font-medium disabled:opacity-40"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(reqItem.id)}
                                        disabled={busyId === reqItem.id}
                                        className="flex-1 py-2.5 rounded-full border border-red-500/30 text-red-400 text-sm font-medium disabled:opacity-40"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
