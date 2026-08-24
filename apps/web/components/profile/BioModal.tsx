'use client'
import { useState } from 'react'
import { User, Profile } from '@/types'

type EditProfileSheetProps = {
    open: boolean
    user: User
    onClose: () => void
    onSave: (data: EditProfileData) => Promise<void>
}

export type EditProfileData = {
    name: string
    bio: string
    location: string
    phone: string
    // agent fields
    zone?: string
    rate?: number
    inspectionFee?: number
    policyNote?: string
}

export function EditProfileSheet({ open, user, onClose, onSave }: EditProfileSheetProps) {
    const isAgent = user.roles.includes('AGENT')
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<EditProfileData>(() => ({
    name:     user.name ?? '',
    bio:      user.profile?.bio ?? '',
    location: user.profile?.location ?? '',
    phone:    user.phone ?? '',
    ...(user.roles.includes('AGENT') ? {
        zone:          user.profile?.zone ?? '',
        rate:          user.profile?.rate ?? undefined,
        inspectionFee: user.profile?.inspectionFee ?? undefined,
        policyNote:    user.profile?.policyNote ?? '',
    } : {}),
}))

    const NUMBER_FIELDS: (keyof EditProfileData)[] = ['rate', 'inspectionFee']

    const set = (key: keyof EditProfileData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const raw = e.target.value
            const value = NUMBER_FIELDS.includes(key)
                ? (raw === '' ? undefined : Number(raw))
                : raw
            setForm(prev => ({ ...prev, [key]: value }))
        }

        const handleSave = async () => {
    setLoading(true)
    try {
        await onSave({
            name:     form.name,
            bio:      form.bio,
            location: form.location,
            phone:    form.phone,
            ...(isAgent ? {
                zone:          form.zone,
                rate:          form.rate,
                inspectionFee: form.inspectionFee,
                policyNote:    form.policyNote,
            } : {}),
        })
        onClose()
    } catch (err: any) {
        const apiError = err?.response?.data?.error
        const message = typeof apiError === 'string' ? apiError : 'Failed to save profile'
        alert(message)
    } finally {
        setLoading(false)
    }
}

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
                <button
                    onClick={onClose}
                    className="text-sm text-gray-300 active:opacity-60"
                >
                    Cancel
                </button>
                <span className="text-base font-bold text-white">Edit Profile</span>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="text-sm font-semibold text-green-400 active:opacity-60 disabled:opacity-40"
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Avatar area */}
            <div className="h-24 bg-[#111] relative flex items-end px-4 pb-2">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-black">
                        {user.profile?.avatarUrl
                            ? <img src={user.profile.avatarUrl} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                        }
                    </div>
                    <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full
                                       bg-gray-800 border border-white/20
                                       flex items-center justify-center">
                        <span className="text-[10px]">📷</span>
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto">
                <EditField
                    label="Name"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Your name"
                />
                <EditTextArea
                    label="Bio"
                    value={form.bio}
                    onChange={set('bio')}
                    placeholder="Tell others about yourself"
                    maxLength={160}
                />
                <EditField
                    label="Location"
                    value={form.location}
                    onChange={set('location')}
                    placeholder="City, State"
                />
                <EditField
                    label="Phone"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+234..."
                    type="tel"
                />

                {/* Agent-only fields */}
                {isAgent && (
                    <>
                        <div className="px-4 pt-6 pb-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">
                                Agent Details
                            </span>
                        </div>
                        <EditField
                            label="Zone"
                            value={form.zone ?? ''}
                            onChange={set('zone')}
                            placeholder="Area you operate in"
                        />
                        <EditField
                            label="Rate (%)"
                            value={form.rate?.toString() ?? ''}
                            onChange={set('rate')}
                            placeholder="e.g. 10"
                            type="number"
                        />
                        <EditField
                            label="Inspection Fee (₦)"
                            value={form.inspectionFee?.toString() ?? ''}
                            onChange={set('inspectionFee')}
                            placeholder="e.g. 5000"
                            type="number"
                        />
                        <EditTextArea
                            label="Policy Note"
                            value={form.policyNote ?? ''}
                            onChange={set('policyNote')}
                            placeholder="Any terms clients should know upfront"
                        />
                    </>
                )}
            </div>
        </div>
    )
}

// Field components — inline since they're only used here

function EditField({ label, value, onChange, placeholder, type = 'text' }: {
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder: string
    type?: string
}) {
    return (
        <div className="flex items-center gap-4 px-4 py-4 border-b border-white/5">
            <span className="text-sm font-semibold text-white w-24 shrink-0">{label}</span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-green-400 placeholder:text-gray-600
                           focus:outline-none"
            />
        </div>
    )
}

function EditTextArea({ label, value, onChange, placeholder, maxLength }: {
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder: string
    maxLength?: number
}) {
    return (
        <div className="flex items-start gap-4 px-4 py-4 border-b border-white/5">
            <span className="text-sm font-semibold text-white w-24 shrink-0 pt-0.5">{label}</span>
            <div className="flex-1">
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    rows={3}
                    className="w-full bg-transparent text-sm text-green-400 placeholder:text-gray-600
                               focus:outline-none resize-none"
                />
                {maxLength && (
                    <span className="text-xs text-gray-600">
                        {value.length}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    )
}