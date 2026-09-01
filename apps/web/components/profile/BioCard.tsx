'use client'

// components/profile/ProfileCard.tsx
import { useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { RatingStars } from '@/components/profile/RatingStars'
import { AvatarCropModal } from '@/components/profile/AvatarCropModal'
import { AvatarLightbox } from '@/components/profile/AvatarLightbox'
import { uploadApi } from '@/lib/api/upload'
import { profileApi } from '@/lib/api/profile'
import { getErrorMessage } from '@/lib/errors'
import { Profile, User } from '@/types'

type ProfileCardProps = {
    user: User
    onEditProfile?: () => void
    onAvatarUploaded?: () => void
    onMessage?: () => void
    isOwnProfile?: boolean
}

function MapPinIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
            <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.3 11.71 6.57 11.98a1.25 1.25 0 0 0 1.86 0C13.2 21.21 19.5 14.75 19.5 9.5 19.5 5.36 16.14 2 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
        </svg>
    )
}

export function ProfileCard({
    user,
    onEditProfile,
    onAvatarUploaded,
    onMessage,
    isOwnProfile,
}: ProfileCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [cropFile, setCropFile] = useState<File | null>(null)
    const [showLightbox, setShowLightbox] = useState(false)

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setCropFile(file)
    }

    const handleCropConfirm = async (blob: Blob) => {
        setCropFile(null)
        setUploading(true)
        try {
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
            const uploadRes = await uploadApi.uploadFile(file)
            await profileApi.update({ avatarUrl: uploadRes.data.url })
            onAvatarUploaded?.()
        } catch (err) {
            console.error(err)
            alert(getErrorMessage(err, 'Could not upload photo. Please try again.'))
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="bg-[#38353B] rounded-2xl p-4 space-y-4 border-[2px] border-gray-400/30">
            <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                    {/* Avatar + info */}
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className="relative"
                                onClick={() => user.profile?.avatarUrl && setShowLightbox(true)}
                            >
                                <Avatar
                                    src={user.profile?.avatarUrl}
                                    name={user.name}
                                    size="lg"
                                />
                                {isOwnProfile && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            fileInputRef.current?.click()
                                        }}
                                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full
                                                    bg-gray-700 border-2 border-[#1c1c1e]
                                                    flex items-center justify-center">
                                        {uploading ? (
                                            <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        ) : (
                                            <span className="text-[10px]">📷</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {isOwnProfile && (
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelected}
                                />
                            )}
                            {user.profile?.bio && (
                                <span className="text-xs bg-amber-700/40 text-amber-400
                                                 px-2 py-0.5 rounded-full w-fit">
                                    Bio
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-lg font-bold text-white">
                                {user.name}
                                {user.profile?.verificationStatus === 'VERIFIED' && (
                                    <VerifiedBadge size="md" />
                                )}
                            </span>
                            {user.profile && (
                                <RatingStars
                                    rating={user.profile.rating}
                                    reviewCount={user.profile.reviewCount}
                                    size="sm"
                                />
                            )}
                            {user.profile?.location && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <MapPinIcon /> {user.profile.location}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-gray-200 italic">
                        {user.profile?.bio ?? 'tell others something about you.'}
                    </p>
                </div>

                {/* Agent strip — agents only */}
                {user.roles?.includes('AGENT') && (
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        {user.profile?.rate != null && (
                            <div className="flex flex-col items-center bg-black rounded-lg px-3 py-1.5">
                                <span className="text-[10px] text-gray-500">Rate</span>
                                <span className="text-xs font-semibold text-white">{user.profile.rate}%</span>
                            </div>
                        )}
                        {user.profile?.inspectionFee != null && (
                            <div className="flex flex-col items-center bg-black rounded-lg px-3 py-1.5">
                                <span className="text-[10px] text-gray-500">Inspection</span>
                                <span className="text-xs font-semibold text-white">
                                    ₦{user.profile.inspectionFee.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {user.profile?.zone && (
                            <div className="flex flex-col items-center bg-black rounded-lg px-3 py-1.5">
                                <span className="text-[10px] text-gray-500">Zone</span>
                                <span className="text-xs font-semibold text-white">{user.profile.zone}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit button */}
            {isOwnProfile && (
                <button
                    onClick={onEditProfile}
                    className="mx-auto block px-14 py-3.5 bg-[#E97014] text-white
                               rounded-full font-semibold active:scale-95 transition-all"
                >
                    ✏️ Edit Profile
                </button>
            )}

            {/* Chat button — viewing another user's profile */}
            {!isOwnProfile && onMessage && (
                <button
                    onClick={onMessage}
                    className="mx-auto block px-14 py-3.5 bg-cyan-500 text-white
                               rounded-[50px] font-semibold active:scale-95 transition-all"
                >
                    💬 Chat
                </button>
            )}

            {cropFile && (
                <AvatarCropModal
                    file={cropFile}
                    onCancel={() => setCropFile(null)}
                    onConfirm={handleCropConfirm}
                />
            )}

            {showLightbox && user.profile?.avatarUrl && (
                <AvatarLightbox
                    src={user.profile.avatarUrl}
                    onClose={() => setShowLightbox(false)}
                />
            )}
        </div>
    )
}
