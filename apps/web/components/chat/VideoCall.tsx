'use client'

import { useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { MicIcon, MicOffIcon, PhoneOffIcon, VideoIcon, VideoOffIcon } from '@/components/ui/Icons'
import { useCall } from '@/context/CallContext'

export default function VideoCall() {
    const { state, peer, localStream, remoteStream, isMuted, isCameraOff, toggleMute, toggleCamera, endCall } = useCall()
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const localVideoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    }, [remoteStream])

    useEffect(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream
    }, [localStream])

    if (!peer) return null

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
            <div className="flex-1 relative flex items-center justify-center">
                {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Avatar src={peer.avatarUrl} name={peer.name} size="lg" />
                        <span className="text-white text-xl font-semibold">{peer.name}</span>
                        <span className="text-white/50 text-sm">{state === 'outbound' ? 'Calling…' : 'Connecting…'}</span>
                    </div>
                )}

                <div className="absolute top-4 right-4 w-24 h-32 rounded-xl bg-white/10 border border-white/10 overflow-hidden">
                    {localStream && !isCameraOff && (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 pb-12">
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
                <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer ${isCameraOff ? 'bg-white/20' : 'bg-white/10'}`}
                >
                    {isCameraOff ? <VideoOffIcon className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                </button>
            </div>
        </div>
    )
}
