'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { profileApi } from '@/lib/api/profile'
import { uploadApi } from '@/lib/api/upload'
import { getErrorMessage } from '@/lib/errors'
import { ChevronLeftIcon } from '@/components/ui/Icons'

const ID_TYPES = ['NIN', "Voter's Card", "Driver's License", 'International Passport']

const inputClass = "w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"

export default function VerifyPage() {
    const router = useRouter()
    const { user, refreshUser } = useAuth()

    const idFileRef = useRef<HTMLInputElement>(null)
    const selfieFileRef = useRef<HTMLInputElement>(null)

    const [nin,        setNin]        = useState('')
    const [idType,     setIdType]     = useState(ID_TYPES[0])
    const [idNumber,   setIdNumber]   = useState('')
    const [idFile,     setIdFile]     = useState<File | null>(null)
    const [selfieFile, setSelfieFile] = useState<File | null>(null)

    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState<string | null>(null)
    const [submitted,  setSubmitted]  = useState(false)

    const canSubmit =
        nin.length === 11 &&
        idNumber.trim().length > 0 &&
        !!idFile &&
        !!selfieFile &&
        !submitting

    const status = user?.verificationStatus ?? 'UNVERIFIED'

    const handleSubmit = async () => {
        if (!canSubmit || !idFile || !selfieFile) return
        setError(null)
        setSubmitting(true)
        try {
            const [idUpload, selfieUpload] = await Promise.all([
                uploadApi.uploadFile(idFile),
                uploadApi.uploadFile(selfieFile),
            ])
            await profileApi.submitVerification({
                nin,
                idType,
                idNumber: idNumber.trim(),
                idDocumentUrl: idUpload.data.url,
                selfieUrl: selfieUpload.data.url,
            })
            await refreshUser()
            setSubmitted(true)
        } catch (err) {
            setError(getErrorMessage(err, 'Could not submit verification. Please try again.'))
        } finally {
            setSubmitting(false)
        }
    }

    const header = (
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
            <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                aria-label="Back"
            >
                <ChevronLeftIcon className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-semibold">Get Verified</h1>
        </div>
    )

    if (status === 'VERIFIED') {
        return (
            <div className="min-h-screen bg-[#1C1B1A] text-white">
                {header}
                <div className="px-4 py-20 flex flex-col items-center text-center">
                    <span className="text-4xl mb-3">✅</span>
                    <h2 className="text-lg font-semibold">You're verified</h2>
                    <p className="mt-1 text-sm text-white/40">Your identity has already been confirmed.</p>
                </div>
            </div>
        )
    }

    if (status === 'PENDING' || submitted) {
        return (
            <div className="min-h-screen bg-[#1C1B1A] text-white">
                {header}
                <div className="px-4 py-20 flex flex-col items-center text-center">
                    <span className="text-4xl mb-3">⏳</span>
                    <h2 className="text-lg font-semibold">Verification pending</h2>
                    <p className="mt-1 text-sm text-white/40">We're reviewing your submission. This usually takes a day or two.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">
            {header}

            <div className="px-4 space-y-5">
                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">NIN (11 digits)</label>
                    <input
                        value={nin}
                        onChange={e => setNin(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                        placeholder="12345678901"
                        inputMode="numeric"
                        className={inputClass}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">ID type</label>
                    <select value={idType} onChange={e => setIdType(e.target.value)} className={inputClass}>
                        {ID_TYPES.map(type => (
                            <option key={type} value={type} className="bg-[#1c1c1e]">{type}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">ID number</label>
                    <input
                        value={idNumber}
                        onChange={e => setIdNumber(e.target.value)}
                        placeholder="ID document number"
                        className={inputClass}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">ID document</label>
                    <button
                        type="button"
                        onClick={() => idFileRef.current?.click()}
                        className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3
                            text-sm text-left text-white/60 active:opacity-70"
                    >
                        {idFile ? idFile.name : 'Tap to upload a photo of your ID'}
                    </button>
                    <input
                        ref={idFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => setIdFile(e.target.files?.[0] ?? null)}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">Selfie</label>
                    <button
                        type="button"
                        onClick={() => selfieFileRef.current?.click()}
                        className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3
                            text-sm text-left text-white/60 active:opacity-70"
                    >
                        {selfieFile ? selfieFile.name : 'Tap to upload a selfie'}
                    </button>
                    <input
                        ref={selfieFileRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={e => setSelfieFile(e.target.files?.[0] ?? null)}
                    />
                </div>

                {error && <p className="text-red-400 text-sm px-1">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all
                        ${canSubmit
                            ? 'bg-blue-500 text-white active:bg-blue-600'
                            : 'bg-white/6 text-white/20 cursor-not-allowed'
                        }`}
                >
                    {submitting ? 'Submitting...' : 'Submit for verification'}
                </button>
            </div>
        </div>
    )
}
