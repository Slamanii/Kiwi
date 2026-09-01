'use client'

const STICKERS = [
    '😀', '😂', '😍', '😎', '🥳', '😢', '😡', '😱',
    '🤔', '🙄', '😴', '🤯', '🥰', '😇', '🤗', '😏',
    '👍', '👎', '👏', '🙌', '🙏', '💪', '✌️', '🤝',
    '❤️', '🔥', '💯', '🎉', '✨', '💰', '🏠', '🚀',
]

type StickerPickerSheetProps = {
    open: boolean
    onClose: () => void
    onSelect: (emoji: string) => void
}

export default function StickerPickerSheet({ open, onClose, onSelect }: StickerPickerSheetProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative w-full bg-neutral-900 rounded-t-3xl pt-4 pb-8 z-10">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />
                <div className="grid grid-cols-5 gap-2 px-4 max-h-80 overflow-y-auto">
                    {STICKERS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => { onSelect(emoji); onClose() }}
                            className="aspect-square flex items-center justify-center text-4xl rounded-xl hover:bg-white/5 active:bg-white/10"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
