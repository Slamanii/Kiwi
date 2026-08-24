export type NotificationSound = 'splash' | 'chime' | 'bell' | 'pop' | 'none'

const STORAGE_KEY = 'kiwi:notificationSound'
const DEFAULT_SOUND: NotificationSound = 'splash'

export const SOUND_OPTIONS: { value: NotificationSound; label: string }[] = [
    { value: 'splash', label: 'Splash' },
    { value: 'chime',  label: 'Chime' },
    { value: 'bell',   label: 'Bell' },
    { value: 'pop',    label: 'Pop' },
    { value: 'none',   label: 'None' },
]

export function getNotificationSound(): NotificationSound {
    if (typeof window === 'undefined') return DEFAULT_SOUND
    return (localStorage.getItem(STORAGE_KEY) as NotificationSound | null) ?? DEFAULT_SOUND
}

export function setNotificationSound(sound: NotificationSound) {
    localStorage.setItem(STORAGE_KEY, sound)
}

let audioCtx: AudioContext | null = null

function tone(
    ctx: AudioContext,
    freq: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = 'sine',
    peakGain = 0.15,
    endFreq?: number
) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    const start = ctx.currentTime + startOffset
    osc.frequency.setValueAtTime(freq, start)
    if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration)
    }
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.start(start)
    osc.stop(start + duration + 0.02)
}

const PRESETS: Record<Exclude<NotificationSound, 'none'>, (ctx: AudioContext) => void> = {
    // quick descending sweep + a bright droplet on top — used for most incoming notifications
    splash: (ctx) => {
        tone(ctx, 1400, 0,    0.22, 'sine', 0.14, 500)
        tone(ctx, 1800, 0.05, 0.12, 'triangle', 0.08)
    },
    chime: (ctx) => { tone(ctx, 880, 0, 0.18); tone(ctx, 1320, 0.1, 0.22) },
    bell:  (ctx) => { tone(ctx, 1046, 0, 0.4, 'triangle', 0.12); tone(ctx, 1568, 0.02, 0.5, 'triangle', 0.06) },
    pop:   (ctx) => { tone(ctx, 600, 0, 0.06, 'square', 0.08); tone(ctx, 900, 0.05, 0.08, 'square', 0.08) },
}

export function playNotificationSound(sound: NotificationSound = getNotificationSound()) {
    if (sound === 'none') return
    try {
        if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext()
        if (audioCtx.state === 'suspended') audioCtx.resume()
        PRESETS[sound](audioCtx)
    } catch (err) {
        console.error('[notification sound] failed to play', err)
    }
}
