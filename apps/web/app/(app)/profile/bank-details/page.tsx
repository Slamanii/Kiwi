'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { profileApi } from '@/lib/api/profile'
import { ChevronLeftIcon } from '@/components/ui/Icons'
import { BankPicker } from '@/components/ui/BankPicker'

const inputClass = "w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"

export default function BankDetailsPage() {
    const router = useRouter()

    const [accountNumber, setAccountNumber] = useState('')
    const [bankCode,      setBankCode]      = useState('')
    const [accountName,   setAccountName]   = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState<string | null>(null)
    const [saved,      setSaved]      = useState(false)

    const canSubmit =
        accountNumber.trim().length > 0 &&
        bankCode.trim().length > 0 &&
        accountName.trim().length > 0 &&
        !submitting

    const handleSubmit = async () => {
        if (!canSubmit) return
        setError(null)
        setSaved(false)
        setSubmitting(true)
        try {
            await profileApi.updateBankDetails({
                accountNumber: accountNumber.trim(),
                bankCode: bankCode.trim(),
                accountName: accountName.trim(),
            })
            setSaved(true)
        } catch (err: any) {
            setError(err.response?.data?.error ?? 'Could not update bank details. Please try again.')
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
                <h1 className="text-lg font-semibold">Bank Details</h1>
            </div>

            <div className="px-4 space-y-5">
                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">Account number</label>
                    <input
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="10-digit account number"
                        inputMode="numeric"
                        className={inputClass}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">Bank</label>
                    <BankPicker value={bankCode} onChange={setBankCode} />
                </div>

                <div className="space-y-1.5">
                    <label className="text-white/60 text-xs">Account name</label>
                    <input
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        placeholder="Name on the account"
                        className={inputClass}
                    />
                </div>

                {error && <p className="text-red-400 text-sm px-1">{error}</p>}
                {saved && <p className="text-green-400 text-sm px-1">Bank details updated.</p>}

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all
                        ${canSubmit
                            ? 'bg-blue-500 text-white active:bg-blue-600'
                            : 'bg-white/6 text-white/20 cursor-not-allowed'
                        }`}
                >
                    {submitting ? 'Saving...' : 'Save bank details'}
                </button>
            </div>
        </div>
    )
}
