'use client'

export type ActionSheetItem = {
    key: string
    label: string
    icon: React.ReactNode
    destructive?: boolean
    onSelect: () => void
}

type ActionSheetProps = {
    open: boolean
    onClose: () => void
    items: ActionSheetItem[]
}

export default function ActionSheet({ open, onClose, items }: ActionSheetProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            <div className="relative w-full bg-neutral-900 rounded-t-3xl pt-4 pb-8 z-10">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 shrink-0" />

                <div className="px-2 py-2 space-y-1">
                    {items.map(item => (
                        <button
                            key={item.key}
                            onClick={() => { item.onSelect(); onClose() }}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 active:bg-white/5 transition-colors"
                        >
                            <span className={item.destructive ? 'text-red-400' : 'text-white/70'}>
                                {item.icon}
                            </span>
                            <span className={`text-sm ${item.destructive ? 'text-red-400' : 'text-white/90'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
