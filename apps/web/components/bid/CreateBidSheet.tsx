'use client'

import { useRef, useState } from 'react'
import { bidApi } from '@/lib/api/bid'
import { uploadApi } from '@/lib/api/upload'
import { getErrorMessage } from '@/lib/errors'
import { CURRENCIES, type Currency } from '@/lib/currency'
import { ChevronLeftIcon } from '@/components/ui/Icons'

const MAX_IMAGES = 6

type CreateBidSheetProps = {
    seekId: string
    onClose: () => void
    onSuccess: () => void
}

export function CreateBidSheet({ seekId, onClose, onSuccess }: CreateBidSheetProps) {
    const [note,     setNote]     = useState('')
    const [rate,     setRate]     = useState('')
    const [amount,   setAmount]   = useState('')
    const [currency, setCurrency] = useState<Currency>(CURRENCIES[0])
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
    const [loading,  setLoading]  = useState(false)

    const [images,    setImages]    = useState<string[]>([])
    const [videoUrl,  setVideoUrl]  = useState<string>()
    const [uploading, setUploading] = useState(false)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)

    const canSubmit = note.trim().length > 0 && rate.length > 0 && amount.length > 0 && !uploading

    const handleImagesPicked = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const room = MAX_IMAGES - images.length
        const picked = Array.from(files).slice(0, room)
        setUploading(true)
        try {
            const results = await Promise.allSettled(picked.map(f => uploadApi.uploadFile(f)))
            const uploaded: string[] = []
            let firstError: unknown
            for (const r of results) {
                if (r.status === 'fulfilled') uploaded.push(r.value.data.url)
                else firstError ??= r.reason
            }
            if (uploaded.length > 0) setImages(prev => [...prev, ...uploaded])
            const failedCount = results.length - uploaded.length
            if (failedCount > 0) {
                alert(getErrorMessage(firstError, `Failed to upload ${failedCount} photo${failedCount > 1 ? 's' : ''}`))
            }
        } finally {
            setUploading(false)
            if (imageInputRef.current) imageInputRef.current.value = ''
        }
    }

    const handleVideoPicked = async (files: FileList | null) => {
        const file = files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const res = await uploadApi.uploadFile(file)
            setVideoUrl(res.data.url)
        } catch (err) {
            alert(getErrorMessage(err, 'Failed to upload video'))
        } finally {
            setUploading(false)
            if (videoInputRef.current) videoInputRef.current.value = ''
        }
    }

    const handleSubmit = async () => {
        if (!canSubmit) return
        setLoading(true)
        try {
            await bidApi.create(seekId, {
                amount:   Number(amount.replace(/,/g, '')),
                rate:     Number(rate),
                currency: currency.code,
                note:     note.trim(),
                images,
                videoUrl,
            })
            onSuccess()
        } catch (err: any) {
            const apiError = err?.response?.data?.error
            const message = typeof apiError === 'string' ? apiError : 'Failed to place bid'
            alert(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-3xl px-4 pt-4 pb-6 z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold text-base">Place a Bid</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/60 active:opacity-70"
                        aria-label="Close"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                        <span className="text-white/40 text-xs shrink-0">Rate %</span>
                        <input
                            value={rate}
                            onChange={e => setRate(e.target.value.replace(/[^0-9.]/g, ''))}
                            placeholder="e.g. 10"
                            inputMode="decimal"
                            className="flex-1 min-w-0 w-full bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                        <button
                            onClick={() => setShowCurrencyPicker(true)}
                            className="text-white/40 text-xs shrink-0 font-mono"
                        >
                            {currency.symbol}
                        </button>
                        <input
                            value={amount}
                            onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                            placeholder="Amount"
                            inputMode="numeric"
                            className="flex-1 min-w-0 w-full bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none"
                        />
                    </div>
                </div>

                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Tell the seeker why you're the right agent..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3
                        text-white/80 text-sm placeholder:text-white/20
                        resize-none focus:outline-none focus:border-white/20 transition-colors"
                />

                <div className="space-y-2">
                    <div className="flex gap-2 overflow-x-auto">
                        {images.map(url => (
                            <div key={url} className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setImages(prev => prev.filter(u => u !== url))}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {videoUrl && (
                            <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                                <video src={videoUrl} className="w-full h-full object-cover" muted />
                                <button
                                    onClick={() => setVideoUrl(undefined)}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={e => handleImagesPicked(e.target.files)}
                        />
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            hidden
                            onChange={e => handleVideoPicked(e.target.files)}
                        />
                        <button
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploading || images.length >= MAX_IMAGES}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                                border border-white/8 text-white/50 text-xs disabled:opacity-30"
                        >
                            📷 Add photos {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
                        </button>
                        <button
                            onClick={() => videoInputRef.current?.click()}
                            disabled={uploading || !!videoUrl}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                                border border-white/8 text-white/50 text-xs disabled:opacity-30"
                        >
                            🎥 {videoUrl ? 'Video added' : 'Add video'}
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all
                        ${canSubmit && !loading
                            ? 'bg-blue-500 text-white active:bg-blue-600'
                            : 'bg-white/6 text-white/20 cursor-not-allowed'
                        }`}
                >
                    {loading ? 'Placing bid...' : 'Place Bid'}
                </button>
            </div>

            {showCurrencyPicker && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowCurrencyPicker(false)} />
                    <div className="relative w-full max-w-sm max-h-[80vh] overflow-y-auto bg-neutral-900 rounded-3xl px-4 pt-4 pb-6 z-10">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-3 px-1">Select Currency</p>
                        <div className="space-y-1">
                            {CURRENCIES.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => { setCurrency(c); setShowCurrencyPicker(false) }}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all
                                        ${currency.code === c.code ? 'bg-white/10 text-white' : 'text-white/60'}`}
                                >
                                    <span className="font-mono text-sm w-8 shrink-0">{c.symbol}</span>
                                    <span className="text-sm flex-1 text-left">{c.name}</span>
                                    <span className="text-xs text-white/25">{c.code}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}