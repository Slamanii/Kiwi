type WelcomecardProps = {
    badge?: string
    title: string
    subtitle: string
    ctaLabel?: string
    onPress?: () => void
}

export function WelcomeCard({
    badge = "New",
    title,
    subtitle,
    ctaLabel = "Let's Go",
    onPress,
}: WelcomecardProps) {
    return (
        <div className="mx-4 rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #111 100%)'
            }}>
                <div className="p-5 space-y-3">
                    <span className="inline-block bg-green-500 text-white
                                        text-xs font-semibold px-3 py-1 rounded-full">
                            {badge}
                     </span>
                     <p className="text-2xl font-bold text-white leading-tight">
                        {title}
                     </p>
                     <p className="text-sm text-gray-400 leading-relaxed">
                        {subtitle}
                     </p>
                     <div className="flex justify-end pt-2">
                        <button 
                            onClick={onPress}
                            className="flex items-center gap-2 bg-cyan-400 text-black
                                        font-semibold text-sm px-6 py-3 rounded-full
                                        active:scale-95 transition-transform"
                        >
                            {ctaLabel}
                            <span>→</span>
                        </button>
                     </div>
                </div>
        </div>
    )
}