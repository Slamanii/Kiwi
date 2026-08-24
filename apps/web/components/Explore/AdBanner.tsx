type AdBannerProps = {
    title: string
    subtitle: string
    onPress?: () => void
}

export function AdBanner({ title, subtitle, onPress }: AdBannerProps) {
    return (
        <button
            onClick={onPress}
            className="mx-4 flex items-center gap-3 bg-green-600/20 border border-green-500/30
                       rounded-2xl px-4 py-3 w-[calc(100%-32px)] active:opacity-70 transition-opacity"
        >
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <span className="text-white text-lg">🤖</span>
            </div>
            <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-green-400">{title}</p>
                <p className="text-xs text-green-500/70">{subtitle}</p>
            </div>
            <span className="text-green-400">›</span>
        </button>
    )
}