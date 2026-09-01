'use client'

import { useMemo, useState } from 'react'
import { NIGERIAN_BANKS } from '@/lib/banks'

const inputClass = "w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"

type BankPickerProps = {
    value: string
    onChange: (bankCode: string) => void
    placeholder?: string
}

export function BankPicker({ value, onChange, placeholder = 'Select your bank' }: BankPickerProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')

    const selected = useMemo(() => NIGERIAN_BANKS.find(b => b.code === value), [value])

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return NIGERIAN_BANKS
        return NIGERIAN_BANKS.filter(b => b.name.toLowerCase().includes(q))
    }, [query])

    function handleSelect(code: string) {
        onChange(code)
        setOpen(false)
        setQuery('')
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`${inputClass} text-left flex items-center justify-between gap-2 cursor-pointer`}
            >
                <span className={selected ? 'text-white' : 'text-white/20'}>
                    {selected ? selected.name : placeholder}
                </span>
                <span className="text-white/30 text-xs shrink-0">▾</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-end">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

                    <div className="relative w-full bg-neutral-900 rounded-t-3xl pt-4 pb-6 z-10 max-h-[85vh] flex flex-col">
                        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />

                        <div className="flex items-center justify-between gap-3 px-4 pb-3 border-b border-white/10 shrink-0">
                            <p className="text-white font-semibold text-sm">Select bank</p>
                            <button onClick={() => setOpen(false)} className="text-white/50 text-xl leading-none cursor-pointer" aria-label="Close">
                                ×
                            </button>
                        </div>

                        <div className="px-4 pt-3 pb-2 shrink-0">
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search banks"
                                className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none"
                            />
                        </div>

                        <div className="overflow-y-auto px-2 pb-2">
                            {results.length === 0 ? (
                                <p className="text-white/30 text-sm text-center py-10">No banks found.</p>
                            ) : (
                                results.map(bank => (
                                    <button
                                        key={bank.code}
                                        type="button"
                                        onClick={() => handleSelect(bank.code)}
                                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left hover:bg-white/5 transition-colors ${
                                            bank.code === value ? 'bg-white/5' : ''
                                        }`}
                                    >
                                        <span className="text-white/90 text-sm truncate">{bank.name}</span>
                                        {bank.code === value && <span className="text-blue-400 text-sm shrink-0">✓</span>}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
