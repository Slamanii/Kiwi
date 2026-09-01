'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useMediaRecorder() {
    const [recording, setRecording] = useState(false)
    const [seconds, setSeconds] = useState(0)
    const streamRef = useRef<MediaStream | null>(null)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    function teardown() {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        recorderRef.current = null
        setRecording(false)
        setSeconds(0)
    }

    const start = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        chunksRef.current = []
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        recorder.start()
        recorderRef.current = recorder
        setRecording(true)
        setSeconds(0)
        intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    }, [])

    const stop = useCallback((): Promise<Blob> => {
        return new Promise((resolve) => {
            const recorder = recorderRef.current
            if (!recorder) { resolve(new Blob()); return }
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
                teardown()
                resolve(blob)
            }
            recorder.stop()
        })
    }, [])

    const cancel = useCallback(() => {
        recorderRef.current?.stop()
        teardown()
    }, [])

    useEffect(() => () => teardown(), [])

    return { recording, seconds, start, stop, cancel }
}
