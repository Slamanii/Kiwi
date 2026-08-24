'use client'

import { useState } from 'react'
import {
    PlusIcon,
    SendIcon,
    CameraIcon,
    ImageIcon,
    VideoIcon,
    MicIcon,
    PaperclipIcon,
    SmileIcon,
    ChecklistIcon,
    PollIcon,
} from '@/components/ui/Icons'
import type { Message } from '@/types'

export type AttachmentType = 'camera' | 'gallery' | 'video' | 'audio' | 'file' | 'sticker' | 'form' | 'poll'

type MessageInputProps = {
    onSend: (content: string) => void
    onAttach?: (type: AttachmentType) => void
    onTyping?: () => void
    onStopTyping?: () => void
    isDisabled?: boolean
    showAgreementOption?: boolean
    // Polls only make sense inside a community — ConversationView derives this from
    // context.kind === 'community' rather than callers passing it manually.
    showPollOption?: boolean
    replyTo?: Message | null
    onCancelReply?: () => void
}

const BASE_MODAL_OPTIONS: { type: AttachmentType; icon: typeof CameraIcon; label: string }[] = [
    { type: 'camera', icon: CameraIcon, label: 'Camera' },
    { type: 'gallery', icon: ImageIcon, label: 'Gallery' },
    { type: 'video', icon: VideoIcon, label: 'Video' },
    { type: 'audio', icon: MicIcon, label: 'Audio' },
    { type: 'file', icon: PaperclipIcon, label: 'File' },
    { type: 'sticker', icon: SmileIcon, label: 'Sticker' },
]

const AGREEMENT_OPTION: { type: AttachmentType; icon: typeof CameraIcon; label: string } =
    { type: 'form', icon: ChecklistIcon, label: 'Checklist' }

const POLL_OPTION: { type: AttachmentType; icon: typeof CameraIcon; label: string } =
    { type: 'poll', icon: PollIcon, label: 'Poll' }

export default function MessageInput({ onSend, onAttach, onTyping, onStopTyping, isDisabled, showAgreementOption, showPollOption, replyTo, onCancelReply }: MessageInputProps) {
    const [text, setText] = useState('')
    const [showAttachModal, setShowAttachModal] = useState(false)
    const MODAL_OPTIONS = [
        ...BASE_MODAL_OPTIONS,
        ...(showAgreementOption ? [AGREEMENT_OPTION] : []),
        ...(showPollOption ? [POLL_OPTION] : []),
    ]

    function handleChange(value: string) {
        setText(value)
        if (value.trim()) onTyping?.()
        else onStopTyping?.()
    }

    function handleSend() {
        if (!text.trim()) return
        onStopTyping?.()
        onSend(text)
        setText('')
    }

    function handleAttach(type: AttachmentType) {
        setShowAttachModal(false)
        onAttach?.(type)
    }

    const isTyping = text.trim().length > 0

    return (
        <div className="relative px-4 py-2.5 shrink-0" style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}>
            {showAttachModal && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60"
                        onClick={() => setShowAttachModal(false)}
                    />
                    <div className="absolute bottom-full left-4 right-4 mb-2 z-50 bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-3 grid grid-cols-3 gap-2 max-w-64 w-full mx-auto">
                        {MODAL_OPTIONS.map(({ type, icon: Icon, label }) => (
                            <button
                                key={type}
                                onClick={() => handleAttach(type)}
                                className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-white hover:bg-white/5 cursor-pointer"
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[11px] text-white/60">{label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {replyTo && (
                <div className="flex items-center gap-2 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 border-b-0 rounded-t-2xl px-3 py-2 mb-[-1px]">
                    <div className="min-w-0 flex-1 border-l-2 border-blue-500 pl-2">
                        <p className="text-blue-400 text-[11px] font-medium">{replyTo.sender?.name ?? 'Message'}</p>
                        <p className="text-white/50 text-xs truncate">
                            {replyTo.deleted ? 'This message was deleted' : replyTo.content ?? 'Attachment'}
                        </p>
                    </div>
                    <button onClick={onCancelReply} className="text-white/40 text-lg leading-none px-1 shrink-0" aria-label="Cancel reply">
                        ×
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 min-w-0">
                <button
                    onClick={() => setShowAttachModal((v) => !v)}
                    disabled={isDisabled}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                        isDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-blue-500 cursor-pointer'
                    }`}
                >
                    <PlusIcon className="w-4 h-4" />
                </button>

                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isDisabled ? 'Thread is closed' : 'Type a message...'}
                    disabled={isDisabled}
                    className={`flex-1 min-w-0 bg-transparent px-2 py-1.5 text-white text-sm outline-none ${
                        isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                />

                {isTyping ? (
                    <button
                        onClick={handleSend}
                        disabled={isDisabled}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                            isDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-blue-500 cursor-pointer'
                        }`}
                    >
                        <SendIcon className="w-4 h-4" />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => onAttach?.('camera')}
                            disabled={isDisabled}
                            className={`w-8 h-8 flex items-center justify-center text-white shrink-0 ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onAttach?.('sticker')}
                            disabled={isDisabled}
                            className={`w-8 h-8 flex items-center justify-center text-white shrink-0 ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <SmileIcon className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
