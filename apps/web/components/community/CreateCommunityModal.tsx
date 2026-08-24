'use client'

import { useRef, useState } from 'react'
import { communityApi } from '@/lib/api/community'
import { uploadApi } from '@/lib/api/upload'
import { getErrorMessage } from '@/lib/errors'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarCropModal } from '@/components/profile/AvatarCropModal'
import type { Community, CommunityCategory, CommunityType } from '@/types'

type Props = {
    type: CommunityType
    onCreated: (community: Community) => void
    onClose: () => void
}

const CATEGORY_LABEL: Record<CommunityCategory, string> = {
    NEIGHBORHOOD: 'Neighborhood',
    REAL_ESTATE: 'Real Estate',
    INTERIOR_DESIGN: 'Interior Design',
    PROPERTY_INVESTMENT: 'Property Investment',
    AGENTS_PROFESSIONALS: 'Agents & Professionals',
    STUDENT_HOUSING: 'Student Housing',
    HOME_SERVICES: 'Home Services',
    GENERAL: 'General',
}
const CATEGORIES = Object.keys(CATEGORY_LABEL) as CommunityCategory[]

export function CreateCommunityModal({ type: initialType, onCreated, onClose }: Props) {
    const [type, setType] = useState<CommunityType>(initialType)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<CommunityCategory>('GENERAL')
    const [requireApproval, setRequireApproval] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [cropFile, setCropFile] = useState<File | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const canSubmit = name.trim().length > 0 && !submitting

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setCropFile(file)
    }

    const handleCropConfirm = async (blob: Blob) => {
        setCropFile(null)
        setUploadingAvatar(true)
        try {
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
            const uploadRes = await uploadApi.uploadFile(file)
            setAvatarUrl(uploadRes.data.url)
        } catch (err) {
            setError(getErrorMessage(err, 'Could not upload photo. Please try again.'))
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSubmitting(true)
        setError(null)
        try {
            const res = await communityApi.create({
                name: name.trim(),
                description: description.trim() || undefined,
                avatarUrl: avatarUrl ?? undefined,
                type,
                category,
                requireApproval,
            })
            onCreated(res.data)
            onClose()
        } catch (err: any) {
            setError(err?.response?.data?.error ?? 'Could not create community')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/60" onClick={onClose}>
            <div
                className="w-full max-h-[88vh] overflow-y-auto bg-neutral-900 rounded-t-3xl px-5 pb-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <p className="text-lg font-bold text-white mb-4">
                    New {type === 'MARKETPLACE' ? 'marketplace' : 'group'}
                </p>

                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <Avatar src={avatarUrl} name={name || 'New'} size="lg" />
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelected}
                        />
                    </div>
                </div>

                <label className="block text-xs font-medium text-white/40 mb-1.5">Type</label>
                <div className="relative flex items-center gap-1 bg-white/5 rounded-full p-1 mb-4">
                    {(['STANDARD', 'MARKETPLACE'] as CommunityType[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`relative flex-1 text-center text-xs font-medium py-1.5 rounded-full transition-colors
                                ${type === t ? 'bg-cyan-400 text-black' : 'text-white/50'}`}
                        >
                            {t === 'STANDARD' ? 'Group' : 'Marketplace'}
                        </button>
                    ))}
                </div>

                <label className="block text-xs font-medium text-white/40 mb-1.5">Name</label>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Community name"
                    maxLength={80}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30"
                />

                <label className="block text-xs font-medium text-white/40 mt-4 mb-1.5">Description</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What's this community about?"
                    maxLength={300}
                    rows={3}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 resize-none"
                />

                <label className="block text-xs font-medium text-white/40 mt-4 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                                ${category === c ? 'bg-cyan-400 text-black' : 'bg-white/5 text-white/50'}`}
                        >
                            {CATEGORY_LABEL[c]}
                        </button>
                    ))}
                </div>

                <button onClick={() => setRequireApproval(v => !v)} className="flex items-center gap-2 mt-4">
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs
                        ${requireApproval ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-white/20'}`}>
                        {requireApproval && '✓'}
                    </span>
                    <span className="text-sm text-white/70">Require approval to join</span>
                </button>

                {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full mt-5 py-3 rounded-full bg-cyan-400 text-black text-sm font-semibold disabled:opacity-40"
                >
                    {submitting ? 'Creating…' : 'Create'}
                </button>
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
