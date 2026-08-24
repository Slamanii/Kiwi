'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'

type Application = {
    id: string
    zone: string
    rate: number
    nin: string
    idType: string
    idNumber: string
    idDocumentUrl: string
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

export default function AdminApplicationsPage() {
    const [status, setStatus] = useState<typeof STATUS_TABS[number]>('PENDING')
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState<string | null>(null)

    const load = () => {
        setLoading(true)
        adminApi.getApplications({ status })
            .then(res => setApplications(res.data.applications))
            .finally(() => setLoading(false))
    }

    useEffect(load, [status])

    const handleApprove = async (id: string) => {
        setBusyId(id)
        try {
            await adminApi.approveApplication(id)
            setApplications(prev => prev.filter(a => a.id !== id))
        } catch (err: any) {
            alert(err.response?.data?.error ?? 'Could not approve application')
        } finally {
            setBusyId(null)
        }
    }

    const handleReject = async (id: string) => {
        const reason = window.prompt('Rejection reason (optional):') ?? undefined
        setBusyId(id)
        try {
            await adminApi.rejectApplication(id, reason)
            setApplications(prev => prev.filter(a => a.id !== id))
        } catch (err: any) {
            alert(err.response?.data?.error ?? 'Could not reject application')
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
            ) : applications.length === 0 ? (
                <p className="text-white/40 text-sm">No {status.toLowerCase()} applications.</p>
            ) : (
                <div className="space-y-3">
                    {applications.map(app => (
                        <div key={app.id} className="bg-white/5 rounded-2xl p-5 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{app.user.name}</p>
                                    <p className="text-white/40 text-xs">{app.user.email}</p>
                                </div>
                                <p className="text-white/40 text-xs">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-white/70">
                                <p>Zone: {app.zone}</p>
                                <p>Rate: {app.rate}</p>
                                <p>NIN: {app.nin}</p>
                                <p>{app.idType}: {app.idNumber}</p>
                            </div>

                            <a
                                href={app.idDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 text-sm underline w-fit"
                            >
                                View ID document
                            </a>

                            {app.status === 'REJECTED' && app.rejectionReason && (
                                <p className="text-red-400 text-xs">Reason: {app.rejectionReason}</p>
                            )}

                            {app.status === 'PENDING' && (
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => handleApprove(app.id)}
                                        disabled={busyId === app.id}
                                        className="flex-1 py-2.5 rounded-full bg-blue-500 text-sm font-medium disabled:opacity-40"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(app.id)}
                                        disabled={busyId === app.id}
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
