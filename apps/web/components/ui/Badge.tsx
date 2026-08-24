type BadgeProps = {
    label: string
    variant?: 'green' | 'gray' | 'red' | 'yellow' | 'blue' | 'purple'
}

export function Badge({ label, variant = 'gray' }: BadgeProps) {
    const variants = {
        green: 'bg-green-100 text-green-700',
        gray: 'bg-gray-100 text-gray-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-700',
        blue: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
            {label}
        </span>
    )
}