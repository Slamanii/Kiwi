type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string
    error?: string
}

export function input({ label, error, className, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <input
                className={`px-4 py-3 rounded-xl border text-sm
                        ${error ? 'border-red-400' : 'border-gray-200'}
                        focus:outline-none focus:ring-2 focus:ring-green-500
                        ${className ?? ''}`}
                {...props}
            />
            {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
    )
}