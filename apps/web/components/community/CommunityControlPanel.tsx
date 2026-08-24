'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { ProfileStat } from '@/components/profile/DataCard'
import { AvatarCropModal } from '@/components/profile/AvatarCropModal'
import { communityApi } from '@/lib/api/community'
import { conversationApi } from '@/lib/api/conversation'
import { uploadApi } from '@/lib/api/upload'
import { getErrorMessage } from '@/lib/errors'
import { MemberList } from './MemberList'
import type { Community, CommunityJoinRequest, CommunityMessagingMode } from '@/types'

type CommunityControlPanelProps = {
    community: Community
    currentUserId: string
    onClose: () => void
    onLeft?: () => void
    onAvatarUpdated?: (avatarUrl: string) => void
}

const MODE_LABEL: Record<CommunityMessagingMode, string> = {
    ADMIN_ONLY: 'Admins only',
    ALL_MEMBERS: 'All members',
    SELECTED_MEMBERS: 'Selected members',
}
const MODE_ORDER: CommunityMessagingMode[] = ['ADMIN_ONLY', 'ALL_MEMBERS', 'SELECTED_MEMBERS']

export default function CommunityControlPanel({ community, currentUserId, onClose, onLeft, onAvatarUpdated }: CommunityControlPanelProps) {
    const router = useRouter()
    const isAdmin = community.currentUserRole === 'ADMIN'
    const isMarketplace = community.type === 'MARKETPLACE'

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [cropFile, setCropFile] = useState<File | null>(null)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [avatarError, setAvatarError] = useState<string | null>(null)

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setCropFile(file)
    }

    const handleCropConfirm = async (blob: Blob) => {
        setCropFile(null)
        setUploadingAvatar(true)
        setAvatarError(null)
        try {
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
            const uploadRes = await uploadApi.uploadFile(file)
            await communityApi.setAvatar(community.id, uploadRes.data.url)
            onAvatarUpdated?.(uploadRes.data.url)
        } catch (err) {
            setAvatarError(getErrorMessage(err, 'Could not upload photo. Please try again.'))
        } finally {
            setUploadingAvatar(false)
        }
    }

    const [muted, setMuted] = useState(false)
    const [pinned, setPinned] = useState(false)
    const [requireApproval, setRequireApproval] = useState(community.requireApproval)
    const [mode, setMode] = useState<CommunityMessagingMode>(community.messagingMode)
    const [busy, setBusy] = useState(false)

    const [showRequests, setShowRequests] = useState(false)
    const [requests, setRequests] = useState<CommunityJoinRequest[]>([])
    const [requestsLoading, setRequestsLoading] = useState(false)

    useEffect(() => {
        if (!showRequests || !isAdmin) return
        setRequestsLoading(true)
        communityApi.getJoinRequests(community.id)
            .then(res => setRequests(res.data))
            .catch(console.error)
            .finally(() => setRequestsLoading(false))
    }, [showRequests, isAdmin, community.id])

    async function toggleMuted() {
        const next = !muted
        setMuted(next)
        try {
            await conversationApi.setMuted('COMMUNITY', community.id, next)
        } catch {
            setMuted(!next)
        }
    }

    async function togglePinned() {
        const next = !pinned
        setPinned(next)
        try {
            await conversationApi.setPinned('COMMUNITY', community.id, next)
        } catch {
            setPinned(!next)
        }
    }

    async function toggleRequireApproval() {
        const next = !requireApproval
        setRequireApproval(next)
        try {
            await communityApi.setRequireApproval(community.id, next)
        } catch {
            setRequireApproval(!next)
        }
    }

    async function cycleMode() {
        const next = MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length]
        const prev = mode
        setMode(next)
        try {
            await communityApi.setMessagingMode(community.id, next)
        } catch {
            setMode(prev)
        }
    }

    async function handleRequestAction(requestId: string, accept: boolean) {
        try {
            if (accept) await communityApi.acceptJoinRequest(community.id, requestId)
            else await communityApi.declineJoinRequest(community.id, requestId)
            setRequests(prev => prev.filter(r => r.id !== requestId))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleLeave() {
        if (busy) return
        if (!confirm('Leave this community?')) return
        setBusy(true)
        try {
            await communityApi.leave(community.id)
            onClose()
            onLeft?.()
            router.push('/communities')
        } catch (err) {
            console.error(err)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            <div className="relative w-full bg-neutral-900 rounded-t-3xl pt-4 pb-10 z-10 max-h-[85vh] flex flex-col">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />

                <div className="overflow-y-auto px-4 space-y-5">
                    <div className="flex flex-col items-center gap-2 pb-2">
                        <div className="relative">
                            <Avatar src={community.avatarUrl} name={community.name} size="lg" />
                            {isAdmin && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full
                                        bg-gray-700 border-2 border-neutral-900
                                        flex items-center justify-center cursor-pointer"
                                >
                                    {uploadingAvatar ? (
                                        <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    ) : (
                                        <span className="text-[10px]">📷</span>
                                    )}
                                </div>
                            )}
                            {isAdmin && (
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelected}
                                />
                            )}
                        </div>
                        {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
                        <div className="text-center">
                            <p className="text-white font-semibold text-base">{community.name}</p>
                            {community.description && (
                                <p className="text-white/40 text-xs mt-0.5 max-w-xs">{community.description}</p>
                            )}
                            <p className="text-white/30 text-xs mt-0.5">
                                {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
                            </p>
                        </div>
                    </div>

                    {isMarketplace && (
                        <div className="flex justify-between gap-2">
                            <ProfileStat icon={<span>✓</span>} iconBg="bg-green-500/30" count={community.dealsCompleted ?? 0} label="Completed" />
                            <ProfileStat icon={<span>☰</span>} iconBg="bg-yellow-500/30" count={community.dealsOngoing ?? 0} label="Ongoing" />
                            <ProfileStat icon={<span>★</span>} iconBg="bg-orange-500/30" count={community.rating ?? 0} label="Rating" />
                            <ProfileStat icon={<span>🏷️</span>} iconBg="bg-cyan-500/30" count={community.listingCount ?? 0} label="Listings" />
                        </div>
                    )}

                    {isMarketplace && isAdmin && (
                        <button
                            onClick={() => router.push(`/marketplace/create?storeId=${community.id}`)}
                            className="w-full py-3 rounded-2xl bg-cyan-400 text-black text-sm font-semibold active:opacity-80 transition-opacity"
                        >
                            + Add Listing
                        </button>
                    )}

                    <div className="space-y-1">
                        <Row label="Muted" onClick={toggleMuted}>
                            <Switch on={muted} />
                        </Row>
                        <Row label="Pinned" onClick={togglePinned}>
                            <Switch on={pinned} />
                        </Row>
                    </div>

                    {isAdmin && (
                        <div className="space-y-1 pt-2 border-t border-white/10">
                            <Row label="Who can send messages" onClick={cycleMode}>
                                <span className="text-cyan-400 text-xs font-medium">{MODE_LABEL[mode]}</span>
                            </Row>
                            <Row label="Approve new members" onClick={toggleRequireApproval}>
                                <Switch on={requireApproval} />
                            </Row>

                            {isMarketplace ? (
                                <>
                                    <Row label="Listings" onClick={() => router.push(`/communities/${community.id}/listings`)} chevron />
                                    <Row label="Orders" onClick={() => router.push(`/communities/${community.id}/orders`)} chevron />
                                </>
                            ) : (
                                <>
                                    <Row label="Join requests" onClick={() => setShowRequests(v => !v)} chevron />
                                    {showRequests && (
                                        <div className="pl-1 pb-1">
                                            {requestsLoading ? (
                                                <p className="text-white/30 text-sm text-center py-4">Loading…</p>
                                            ) : requests.length === 0 ? (
                                                <p className="text-white/30 text-sm text-center py-4">No pending requests.</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {requests.map(r => (
                                                        <div key={r.id} className="flex items-center gap-3 py-2">
                                                            <Avatar src={r.user.profile?.avatarUrl} name={r.user.name} size="md" />
                                                            <p className="flex-1 min-w-0 text-white text-sm truncate">{r.user.name}</p>
                                                            <button
                                                                onClick={() => handleRequestAction(r.id, true)}
                                                                className="text-[11px] font-semibold text-black bg-cyan-400 px-3 py-1 rounded-full"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRequestAction(r.id, false)}
                                                                className="text-[11px] font-semibold text-white/50 px-3 py-1 rounded-full border border-white/10"
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="pt-2 border-t border-white/10">
                        <p className="text-white/40 text-xs font-medium px-3 pb-1">
                            {community.memberCount} {community.memberCount === 1 ? 'Member' : 'Members'}
                        </p>
                        <MemberList
                            communityId={community.id}
                            isAdmin={isAdmin}
                            currentUserId={currentUserId}
                            messagingMode={mode}
                        />
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        <Row label="Leave community" onClick={handleLeave} danger />
                    </div>
                </div>
            </div>

            {cropFile && (
                <AvatarCropModal
                    file={cropFile}
                    onCancel={() => setCropFile(null)}
                    onConfirm={handleCropConfirm}
                />
            )}
        </div>
    )
}

function Row({ label, onClick, children, chevron, danger }: { label: string; onClick: () => void; children?: React.ReactNode; chevron?: boolean; danger?: boolean }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
        >
            <span className={`text-sm ${danger ? 'text-red-400' : 'text-white/90'}`}>{label}</span>
            {children}
            {chevron && <span className="text-white/20 text-sm">›</span>}
        </button>
    )
}

function Switch({ on }: { on: boolean }) {
    return (
        <div className={`w-9 h-5 rounded-full transition-colors relative ${on ? 'bg-cyan-400' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`} />
        </div>
    )
}
