type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const base = 'rounded-xl font-medium transition-all active:scale-95 disabledopacity-50'

    const variants = {
        primary: 'bg-blue-600 text-white',
        secondary: 'bg-gray-100 text-gray-800',
        ghost: 'bg-transparent text-blue-600',
        danger: 'bg-red-500 text-white',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'w-full px-4 py-3.5 text-base',
    }

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
            disabled={disabled || loading}
            {...props}
            >
                {loading ? <span className="animate-pulse">...</span>: children}
            </button>
    )
}