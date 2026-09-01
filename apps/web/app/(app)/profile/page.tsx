'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ProfileCard } from '@/components/profile/BioCard'
import { EditProfileSheet, EditProfileData } from '@/components/profile/BioModal'
import { ProfileStatsGrid } from '@/components/profile/DataCard'
import { ProfileMenuItem } from '@/components/profile/ProfileMenuItem'
import { profileApi } from '@/lib/api/profile'
import { uploadApi } from '@/lib/api/upload'
import { getErrorMessage } from '@/lib/errors'
import { MediaViewport } from '@/components/ui/MediaViewport'

type CatalogItem = {
    id: string
    url: string
    type: 'IMAGE' | 'VIDEO'
    caption?: string | null
}

const MAX_CATALOG_ITEMS = 10

export default function ProfilePage() {
    const router                          = useRouter()
    const { user, logout, refreshUser }   = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [editOpen,       setEditOpen]       = useState(false)
    const [catalogOpen,    setCatalogOpen]    = useState(false)
    const [catalogItems,   setCatalogItems]   = useState<CatalogItem[]>([])
    const [catalogLoaded,  setCatalogLoaded]  = useState(false)
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [catalogUploading, setCatalogUploading] = useState(false)
    const [catalogError,   setCatalogError]   = useState<string | null>(null)

    const [pendingFile,        setPendingFile]        = useState<File | null>(null)
    const [pendingPreviewUrl,  setPendingPreviewUrl]   = useState<string | null>(null)
    const [pendingCaption,     setPendingCaption]      = useState('')

    const [viewingIndex,   setViewingIndex]   = useState<number | null>(null)

    const [editingItem,    setEditingItem]    = useState<CatalogItem | null>(null)
    const [editCaption,    setEditCaption]    = useState('')
    const [editSaving,     setEditSaving]     = useState(false)
    const [editError,      setEditError]      = useState<string | null>(null)

    const catalogFull = catalogLoaded && catalogItems.length >= MAX_CATALOG_ITEMS

    if (!user) return null

    const isAgent = user.roles?.includes('AGENT') ?? false

    const handleSave = async (data: EditProfileData) => {
        await profileApi.update(data)
        await refreshUser()
    }

    const handleCatalogToggle = async () => {
        if (!catalogOpen && !catalogLoaded) {
            setCatalogLoading(true)
            try {
                const res = await profileApi.getCatalog(user.id)
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

    const handlePickFile = () => {
        setCatalogError(null)
        if (catalogFull) {
            setCatalogError(`Catalog is full (${MAX_CATALOG_ITEMS}/${MAX_CATALOG_ITEMS}). Remove an item before adding a new one.`)
            return
        }
        fileInputRef.current?.click()
    }

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        setPendingFile(file)
        setPendingPreviewUrl(URL.createObjectURL(file))
        setPendingCaption('')
    }

    const closeComposer = () => {
        if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
        setPendingFile(null)
        setPendingPreviewUrl(null)
        setPendingCaption('')
    }

    const handlePostCatalogItem = async () => {
        if (!pendingFile) return

        setCatalogError(null)
        setCatalogUploading(true)
        try {
            const uploadRes = await uploadApi.uploadFile(pendingFile)
            const type = uploadRes.data.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
            const itemRes = await profileApi.addCatalogItem({
                url: uploadRes.data.url,
                type,
                caption: pendingCaption.trim() || undefined,
            })
            setCatalogItems(prev => [itemRes.data, ...prev])
            setCatalogLoaded(true)
            closeComposer()
        } catch (err) {
            console.error(err)
            setCatalogError(getErrorMessage(err, 'Could not add catalog item. Please try again.'))
        } finally {
            setCatalogUploading(false)
        }
    }

    const handleDeleteCatalogItem = async (itemId: string) => {
        const prev = catalogItems
        setCatalogItems(items => items.filter(i => i.id !== itemId))
        setViewingIndex(null)
        try {
            await profileApi.deleteCatalogItem(itemId)
        } catch (err) {
            console.error(err)
            setCatalogItems(prev)
            setCatalogError('Could not delete catalog item. Please try again.')
        }
    }

    const handleShareCatalogItem = (item: CatalogItem) => {
        if (navigator.share) {
            navigator.share({ title: 'Kiwi', text: item.caption ?? undefined, url: item.url }).catch(() => {})
        } else {
            navigator.clipboard.writeText(item.url)
        }
    }

    const handleEditCatalogItem = (item: CatalogItem) => {
        setEditError(null)
        setEditCaption(item.caption ?? '')
        setEditingItem(item)
    }

    const closeEditor = () => {
        setEditingItem(null)
        setEditCaption('')
        setEditError(null)
    }

    const handleSaveCaption = async () => {
        if (!editingItem) return
        setEditSaving(true)
        setEditError(null)
        try {
            const res = await profileApi.updateCatalogItem(editingItem.id, editCaption.trim() || undefined)
            setCatalogItems(items => items.map(i => i.id === editingItem.id ? res.data : i))
            closeEditor()
        } catch (err) {
            console.error(err)
            setEditError(getErrorMessage(err, 'Could not update caption. Please try again.'))
        } finally {
            setEditSaving(false)
        }
    }

    const MENU_ITEMS = [
        { label: 'Notifications',  onPress: () => router.push('/profile/notifications')       },
        ...(!isAgent
            ? [{ label: 'Become an Agent', onPress: () => router.push('/profile/agent-application') }]
            : []
        ),
        { label: 'Get Verified',   onPress: () => router.push('/profile/verify')              },
        { label: 'Referral Code',  onPress: () => router.push('/profile/referral')            },
        { label: 'Bank Details',   onPress: () => router.push('/profile/bank-details')        },
        { label: 'Go Premium',     onPress: () => router.push('/profile/premium')             },
        { label: 'See Forms',      onPress: () => router.push('/profile/forms')               },
        { label: 'Investments',    onPress: () => router.push('/profile/investments')         },
        { label: 'Analytics',      onPress: () => router.push('/profile/analytics')           },
    ]

    return (
        <div className="min-h-screen bg-[#38353B] text-white flex flex-col">
            {/* Top card — full-bleed, flush with the top edge */}
            <div className="bg-black rounded-b-3xl px-4 pt-14 pb-4 space-y-4">
                <ProfileCard
                    user={user}
                    isOwnProfile
                    onEditProfile={() => setEditOpen(true)}
                    onAvatarUploaded={refreshUser}
                />

                {user.profile && (
                    <ProfileStatsGrid
                        profile={user.profile}
                        onRequestsPress={() => router.push(`/profile/${user.id}/requests`)}
                        onReviewsPress={() => router.push(`/profile/${user.id}/reviews`)}
                    />
                )}
            </div>

            {/* Catalog */}
            <div className="px-4 pt-5 pb-5 space-y-3">
                <div className="flex gap-2">
                    <button
                        onClick={handleCatalogToggle}
                        className="flex-1 py-3 rounded-full bg-black
                            text-blue-400 text-sm font-medium active:opacity-70 transition-opacity"
                    >
                        {catalogOpen ? 'Hide Catalog' : 'Catalog'}
                    </button>
                    <button
                        onClick={handlePickFile}
                        disabled={catalogUploading}
                        className="w-12 py-3 rounded-full bg-black
                            text-blue-400 text-lg font-medium active:opacity-70 transition-opacity
                            disabled:opacity-40"
                        aria-label="Add catalog item"
                    >
                        {catalogUploading ? (
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                        ) : '+'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileSelected}
                    />
                </div>

                {catalogError && (
                    <p className="text-red-400 text-xs px-1">{catalogError}</p>
                )}

                {catalogOpen && (
                    <div className="grid grid-cols-3 gap-2">
                        {catalogLoading ? (
                            [0, 1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
                            ))
                        ) : catalogItems.length === 0 ? (
                            <div className="col-span-3 py-10 text-center">
                                <p className="text-white/25 text-sm">No catalog items yet. Tap + to add one.</p>
                            </div>
                        ) : (
                            catalogItems.map((item, i) => (
                                <button
                                    key={item.id}
                                    onClick={() => setViewingIndex(i)}
                                    className="relative aspect-square bg-[#1c1c1e] rounded-2xl overflow-hidden text-left"
                                >
                                    {item.type === 'VIDEO' ? (
                                        <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                                    ) : (
                                        <img src={item.url} alt={item.caption ?? ''} className="w-full h-full object-cover" />
                                    )}
                                    {item.caption && (
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                                            <p className="text-white/90 text-xs line-clamp-2">{item.caption}</p>
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Menu — full-bleed */}
            <div className="bg-black rounded-3xl px-4">
                {MENU_ITEMS.map(item => (
                    <ProfileMenuItem key={item.label} label={item.label} onPress={item.onPress} />
                ))}
            </div>

            {/* Trailing black section — flush with the bottom edge, holds the log out button */}
            <div className="flex-1 min-h-[200px] bg-black rounded-t-3xl px-4 pt-8 mt-6">
                <button
                    onClick={logout}
                    className="w-full py-3.5 rounded-full border border-red-500/30
                        text-red-400 text-sm font-medium active:opacity-70 transition-opacity"
                >
                    ↪ Log out
                </button>
            </div>

            <EditProfileSheet
                open={editOpen}
                user={user}
                onClose={() => setEditOpen(false)}
                onSave={handleSave}
            />

            {/* Add-to-catalog composer */}
            {pendingFile && pendingPreviewUrl && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-end sm:items-center sm:justify-center">
                    <div className="w-full sm:max-w-sm bg-[#1c1c1e] rounded-t-3xl sm:rounded-3xl p-4 space-y-3">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-black">
                            {pendingFile.type.startsWith('video/') ? (
                                <video src={pendingPreviewUrl} className="w-full h-full object-cover" controls muted playsInline />
                            ) : (
                                <img src={pendingPreviewUrl} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <textarea
                            value={pendingCaption}
                            onChange={(e) => setPendingCaption(e.target.value)}
                            maxLength={1000}
                            placeholder="Write something about this item..."
                            rows={3}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2
                                text-sm text-white placeholder:text-white/30 resize-none focus:outline-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={closeComposer}
                                disabled={catalogUploading}
                                className="flex-1 py-3 rounded-full border border-white/15
                                    text-white/70 text-sm font-medium active:opacity-70 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePostCatalogItem}
                                disabled={catalogUploading}
                                className="flex-1 py-3 rounded-full bg-blue-500
                                    text-white text-sm font-medium active:opacity-70 disabled:opacity-40"
                            >
                                {catalogUploading ? 'Posting...' : 'Add to Catalog'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingIndex !== null && (
                <MediaViewport
                    items={catalogItems.map(item => ({
                        type: item.type === 'VIDEO' ? 'video' as const : 'image' as const,
                        url: item.url,
                        caption: item.caption,
                    }))}
                    initialIndex={viewingIndex}
                    onClose={() => setViewingIndex(null)}
                    onShare={(_, i) => handleShareCatalogItem(catalogItems[i])}
                    onEdit={(_, i) => handleEditCatalogItem(catalogItems[i])}
                    onDelete={(_, i) => handleDeleteCatalogItem(catalogItems[i].id)}
                />
            )}

            {/* Edit-caption sheet */}
            {editingItem && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-end sm:items-center sm:justify-center">
                    <div className="w-full sm:max-w-sm bg-[#1c1c1e] rounded-t-3xl sm:rounded-3xl p-4 space-y-3">
                        <p className="text-white text-sm font-medium">Edit caption</p>
                        <textarea
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            maxLength={1000}
                            placeholder="Write something about this item..."
                            rows={3}
                            autoFocus
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2
                                text-sm text-white placeholder:text-white/30 resize-none focus:outline-none"
                        />
                        {editError && <p className="text-red-400 text-xs">{editError}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={closeEditor}
                                disabled={editSaving}
                                className="flex-1 py-3 rounded-full border border-white/15
                                    text-white/70 text-sm font-medium active:opacity-70 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCaption}
                                disabled={editSaving}
                                className="flex-1 py-3 rounded-full bg-blue-500
                                    text-white text-sm font-medium active:opacity-70 disabled:opacity-40"
                            >
                                {editSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

