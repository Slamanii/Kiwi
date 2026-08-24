type QuickLinkCardProps = {
    title: string
    subtitle: string
    bg: string
    icon: string
    onPress?: () => void
}

export function QuickLinkCard({ title, subtitle, bg, icon, onPress }: QuickLinkCardProps) {
    return (
        <button
            onClick={onPress}
            className={`w-[155px] h-[145px] rounded-3xl p-4 flex flex-col justify-between
                        active:opacity-80 transition-opacity ${bg}`}
            >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-xl">{icon}</span>
                </div>
                <div className="space-y-0.5 text-left">
                    <p className="text-lg font-bold text-white">{title}</p>
                    <p className="text-xs text-white/70 leading-snug">{subtitle}</p>
                </div>
                <div className="self-end w-8 h-8 rounded-full bg-white/20
                                flex items-center justify-center">
                    <span className="text-white text-sm">→</span>

                </div>
            </button>
    )
}