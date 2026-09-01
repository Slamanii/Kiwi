'use client'

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react'

function readValue<T>(key: string, initialValue: T): T {
    if (typeof window === 'undefined') return initialValue
    try {
        const item = window.localStorage.getItem(key)
        return item ? (JSON.parse(item) as T) : initialValue
    } catch {
        return initialValue
    }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(initialValue)

    useEffect(() => {
        setValue(readValue(key, initialValue))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    const setAndPersist: Dispatch<SetStateAction<T>> = useCallback(next => {
        setValue(prev => {
            const resolved = next instanceof Function ? next(prev) : next
            try {
                window.localStorage.setItem(key, JSON.stringify(resolved))
            } catch {
                // ignore write failures (e.g. storage full or disabled)
            }
            return resolved
        })
    }, [key])

    return [value, setAndPersist]
}
