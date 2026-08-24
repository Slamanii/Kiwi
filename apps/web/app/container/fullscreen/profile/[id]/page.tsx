'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ProfileCard } from '@/components/profile/BioCard'
import { ProfileStatsGrid } from '@/components/profile/DataCard'
import { profileApi } from '@/lib/api/profile'
import type { User } from '@/types'
import { ChevronLeftIcon } from '@/components/ui/Icons'

type CatalogItem = {
    id: string
    url: string
    type: 'IMAGE' | 'VIDEO'
}

export default function PublicProfilePage() {
    const router        = useRouter()
    const { id }        = useParams<{ id: string }>()
    const { user: me }  = useAuth()

    const [profile,        setProfile]        = useState<User | null>(null)
    const [loading,        setLoading]        = useState(true)
    const [catalogOpen,    setCatalogOpen]    = useState(false)
    const [catalogItems,   setCatalogItems]   = useState<CatalogItem[]>([])
    const [catalogLoaded,  setCatalogLoaded]  = useState(false)
    const [catalogLoading, setCatalogLoading] = useState(false)

    const isOwnProfile = me?.id === id

    useEffect(() => {
        if (!id) return
        profileApi.getById(id)
            .then(res => setProfile(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    const handleCatalogToggle = async () => {
        if (!catalogOpen && !catalogLoaded) {
            setCatalogLoading(true)
            try {
                const res = await profileApi.getCatalog(id)
                setCatalogItems(res.data.items ?? [])
                setCatalogLoaded(true)
            } catch (err) {
                console.error(err)
            } finally {
                setCatalogLoading(false)
            }
        }
        setCatalogOpen(v => !v)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <p className="text-white/30 text-sm">Profile not found.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white pb-12">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-14 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <span className="text-base font-semibold text-white">{profile.name}</span>
            </div>

            <div className="px-4 py-4 space-y-4">
                <ProfileCard
                    user={profile}
                    isOwnProfile={isOwnProfile}
                    onEditProfile={isOwnProfile ? () => router.push('/profile') : undefined}
                    onMessage={!isOwnProfile ? () => router.push(`/chat/dm/${profile.id}`) : undefined}
                    onAvatarUploaded={() => {
                        profileApi.getById(id).then(res => setProfile(res.data)).catch(console.error)
                    }}
                />

                {profile.profile && (
                    <ProfileStatsGrid
                        profile={profile.profile}
                        onRequestsPress={() => router.push(`/profile/${id}/requests`)}
                        onReviewsPress={() => router.push(`/profile/${id}/reviews`)}
                    />
                )}
            </div>

            {/* Catalog */}
            <div className="px-4 pt-3 space-y-3">
                <button
                    onClick={handleCatalogToggle}
                    className="w-full py-3 rounded-full border border-blue-500/30
                        text-blue-400 text-sm font-medium active:opacity-70 transition-opacity"
                >
                    {catalogOpen ? 'Hide Catalog' : 'Catalog'}
                </button>

                {catalogOpen && (
                    <div className="grid grid-cols-2 gap-2">
                        {catalogLoading ? (
                            [0, 1, 2, 3].map(i => (
                                <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
                            ))
                        ) : catalogItems.length === 0 ? (
                            <div className="col-span-2 py-10 text-center">
                                <p className="text-white/25 text-sm">No catalog items yet.</p>
                            </div>
                        ) : (
                            catalogItems.map(item => (
                                <div key={item.id} className="aspect-square bg-[#1c1c1e] rounded-2xl overflow-hidden">
                                    {item.type === 'VIDEO' ? (
                                        <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                                    ) : (
                                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}