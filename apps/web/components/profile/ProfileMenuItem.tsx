type ProfileMenuItemProps = {
    label: string
    onPress: () => void
    danger?: boolean
}

export function ProfileMenuItem({
    label,
    onPress,
    danger,
}: ProfileMenuItemProps) {
    return (
        <button
            onClick={onPress}
            className="w-full flex items-center justify-between py-5
                       border-b border-white/5 active:opacity-60 transition-opacity"
        >
            <span className={`text-base font-medium ${danger ? 'text-red-400' : 'text-white'}`}>
                {label}
            </span>
            <div className="flex items-center gap-2">
                <span className="text-gray-500">›</span>
            </div>
        </button>
    )
}