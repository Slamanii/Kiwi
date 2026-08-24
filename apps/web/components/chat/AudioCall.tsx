'use client'

import { useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { MicIcon, MicOffIcon, PhoneOffIcon } from '@/components/ui/Icons'
import { useCall } from '@/context/CallContext'

export default function AudioCall() {
    const { state, peer, remoteStream, isMuted, toggleMute, endCall } = useCall()
    const remoteAudioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream
    }, [remoteStream])

    if (!peer) return null

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between py-16">
            <audio ref={remoteAudioRef} autoPlay playsInline />

            <div className="flex flex-col items-center gap-4 mt-12">
                <Avatar src={peer.avatarUrl} name={peer.name} size="lg" />
                <span className="text-white text-xl font-semibold">{peer.name}</span>
                <span className="text-white/50 text-sm">{state === 'outbound' ? 'Calling…' : 'Connected'}</span>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer ${isMuted ? 'bg-white/20' : 'bg-white/10'}`}
                >
                    {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                </button>
                <button
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white cursor-pointer"
                >
                    <PhoneOffIcon className="w-7 h-7" />
                </button>
            </div>
        </div>
    )
}
