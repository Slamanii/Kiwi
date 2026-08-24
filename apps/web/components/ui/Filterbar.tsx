type Filter<T> = { label: string; value: T }

export function FilterBar<T>({ filters, active, onChange }: {
    filters: Filter<T>[]
    active: T
    onChange: (value: T) => void
}) {
    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
            {filters.map(f => (
                <button 
                    key={String(f.value)}
                    onClick={() => onChange(f.value)}
                    className={`shrink-0 px-4 py-1.5 rounded-ful text-sm font-medium transition-colors
                        ${active === f.value
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600'}`}
                            >
                                {f.label}
                </button>
            ))}
        </div>
    )
}