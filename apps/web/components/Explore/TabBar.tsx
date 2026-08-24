'use client'

type Tab<T extends string> = { key: T; label: string }

type Props<T extends string> = {
    tabs: Tab<T>[]
    active: T
    onChange: (key: T) => void
}

export function TabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
    return (
        <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
            {tabs.map(t => (
                <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    className={`relative shrink-0 px-4 py-3 text-[15px] font-semibold transition-colors
                        ${active === t.key ? 'text-white' : 'text-white/40'}`}
                >
                    {t.label}
                    {active === t.key && (
                        <span className="absolute left-4 right-4 -bottom-px h-[3px] rounded-full bg-cyan-400" />
                    )}
                </button>
            ))}
        </div>
    )
}
