'use client'

import { useEffect, useRef, useState } from 'react'
import { MicIcon, TrashIcon, StopIcon } from '@/components/ui/Icons'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'

function formatDuration(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

type AudioRecorderSheetProps = {
    open: boolean
    onClose: () => void
    onSend: (blob: Blob, seconds: number) => void
}

export default function AudioRecorderSheet({ open, onClose, onSend }: AudioRecorderSheetProps) {
    const { recording, seconds, start, stop, cancel } = useMediaRecorder()
    const [error, setError] = useState<string | null>(null)
    const startedRef = useRef(false)

    useEffect(() => {
        if (!open) { startedRef.current = false; return }
        if (startedRef.current) return
        startedRef.current = true
        setError(null)
        start().catch(() => setError('Microphone access was denied.'))
    }, [open, start])

    function handleClose() {
        cancel()
        onClose()
    }

    async function handleSend() {
        const blob = await stop()
        onSend(blob, seconds)
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
            <div className="relative w-full bg-neutral-900 rounded-t-3xl pt-4 pb-8 z-10 flex flex-col items-center">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />

                {error ? (
                    <div className="px-6 py-8 text-center">
                        <p className="text-white/70 text-sm">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-red-500/20 ${recording ? 'animate-pulse' : ''}`}>
                            <MicIcon className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-white text-2xl font-semibold mt-4 tabular-nums">{formatDuration(seconds)}</p>
                        <p className="text-white/40 text-xs mt-1">{recording ? 'Recording…' : 'Preparing…'}</p>
                    </>
                )}

                <div className="flex items-center gap-6 mt-8">
                    <button
                        onClick={handleClose}
                        className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"
                        aria-label="Cancel"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    {!error && (
                        <button
                            onClick={handleSend}
                            disabled={!recording}
                            className="w-12 h-12 rounded-full bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center"
                            aria-label="Send"
                        >
                            <StopIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
