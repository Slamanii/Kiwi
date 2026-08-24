'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { uploadApi } from '@/lib/api/upload'
import { getErrorMessage } from '@/lib/errors'
import { ChevronLeftIcon } from '@/components/ui/Icons'

const ID_TYPES = ['NIN', "Voter's Card", "Driver's License", 'International Passport']

export default function AgentApplicationPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [zone,        setZone]        = useState('')
    const [rate,         setRate]        = useState('')
    const [policyNote,  setPolicyNote]  = useState('')
    const [nin,          setNin]         = useState('')
    const [idType,      setIdType]      = useState(ID_TYPES[0])
    const [idNumber,    setIdNumber]    = useState('')
    const [idFile,       setIdFile]      = useState<File | null>(null)
    const [bio,           setBio]         = useState('')
    const [phone,        setPhone]       = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [bankCode,     setBankCode]     = useState('')
    const [accountName,  setAccountName]  = useState('')
    const [referralCode, setReferralCode] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [error,       setError]       = useState<string | null>(null)

    const canSubmit =
        zone.trim().length > 0 &&
        rate.length > 0 &&
        policyNote.trim().length > 0 &&
        nin.length === 11 &&
        idNumber.trim().length > 0 &&
        !!idFile &&
        accountNumber.trim().length > 0 &&
        bankCode.trim().length > 0 &&
        accountName.trim().length > 0 &&
        !submitting

    const handleSubmit = async () => {
        if (!canSubmit || !idFile) return
        setError(null)
        setSubmitting(true)
        try {
            const uploadRes = await uploadApi.uploadFile(idFile)
            await authApi.becomeAgent({
                zone: zone.trim(),
                rate: Number(rate),
                policyNote: policyNote.trim(),
                nin,
                idNumber: idNumber.trim(),
                idType,
                idDocumentUrl: uploadRes.data.url,
                bio: bio.trim() || undefined,
                phone: phone.trim() || undefined,
                accountNumber: accountNumber.trim(),
                bankCode: bankCode.trim(),
                accountName: accountName.trim(),
                agentReferralCode: referralCode.trim() || undefined,
            })
            router.push('/profile')
        } catch (err) {
            setError(getErrorMessage(err, 'Could not submit application. Please try again.'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-28">
            <div className="flex items-center gap-3 px-4 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-[#38353B] flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-lg font-semibold">Become an Agent</h1>
            </div>

            <div className="px-4 space-y-5">
                <Section title="Work details">
                    <Field label="Zone / Area you cover">
                        <input
                            value={zone}
                            onChange={e => setZone(e.target.value)}
                            placeholder="e.g. Lekki, Ikeja"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Commission rate (%)">
                        <input
                            value={rate}
                            onChange={e => setRate(e.target.value.replace(/[^0-9.]/g, ''))}
                            placeholder="e.g. 10"
                            inputMode="decimal"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Policy note">
                        <textarea
                            value={policyNote}
                            onChange={e => setPolicyNote(e.target.value)}
                            placeholder="Describe your inspection / agreement policy..."
                            rows={4}
                            className={`${inputClass} resize-none`}
                        />
                    </Field>
                    <Field label="Bio (optional)">
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="A short intro clients will see..."
                            rows={3}
                            className={`${inputClass} resize-none`}
                        />
                    </Field>
                    <Field label="Phone (optional)">
                        <input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="e.g. 08012345678"
                            inputMode="tel"
                            className={inputClass}
                        />
                    </Field>
                </Section>

                <Section title="Identity verification">
                    <Field label="NIN (11 digits)">
                        <input
                            value={nin}
                            onChange={e => setNin(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                            placeholder="12345678901"
                            inputMode="numeric"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="ID type">
                        <select
                            value={idType}
                            onChange={e => setIdType(e.target.value)}
                            className={inputClass}
                        >
                            {ID_TYPES.map(type => (
                                <option key={type} value={type} className="bg-[#1c1c1e]">{type}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="ID number">
                        <input
                            value={idNumber}
                            onChange={e => setIdNumber(e.target.value)}
                            placeholder="ID document number"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="ID document">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3
                                text-sm text-left text-white/60 active:opacity-70"
                        >
                            {idFile ? idFile.name : 'Tap to upload a photo of your ID'}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={e => setIdFile(e.target.files?.[0] ?? null)}
                        />
                    </Field>
                </Section>

                <Section title="Payout details">
                    <Field label="Account number">
                        <input
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="10-digit account number"
                            inputMode="numeric"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Bank code">
                        <input
                            value={bankCode}
                            onChange={e => setBankCode(e.target.value)}
                            placeholder="e.g. 058"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Account name">
                        <input
                            value={accountName}
                            onChange={e => setAccountName(e.target.value)}
                            placeholder="Name on the account"
                            className={inputClass}
                        />
                    </Field>
                </Section>

                <Section title="Referral (optional)">
                    <Field label="Referral code">
                        <input
                            value={referralCode}
                            onChange={e => setReferralCode(e.target.value)}
                            placeholder="Code from another agent"
                            className={inputClass}
                        />
                    </Field>
                </Section>

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
                    {submitting ? 'Submitting...' : 'Submit application'}
                </button>
            </div>
        </div>
    )
}

const inputClass = "w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h2 className="text-white/40 text-xs font-medium uppercase tracking-wide">{title}</h2>
            {children}
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-white/60 text-xs">{label}</label>
            {children}
        </div>
    )
}
