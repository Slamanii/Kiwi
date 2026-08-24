type SeekMetaCardProps = {
    icon: React.ReactNode
    label: string
    value: string
    onClick?: () => void
}

export function SeekMetaCard({ icon, label, value, onClick }: SeekMetaCardProps) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 bg-[#1c1c1e] rounded-2xl p-4
                ${onClick ? 'active:opacity-70 cursor-pointer' : ''}`}
        >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm font-medium text-white">{value}</span>
            </div>
            {onClick && (
                <span className="ml-auto text-gray-500">›</span>
            )}
        </div>
    )
}