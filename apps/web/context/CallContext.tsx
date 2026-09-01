'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'

export type CallKind = 'audio' | 'video'
export type CallState = 'idle' | 'outbound' | 'inbound' | 'active'

export type CallPeer = {
    id: string
    name: string
    avatarUrl?: string | null
    verified?: boolean
}

type CallSignalPayload = {
    callId: string
    toUserId: string
    fromUserId: string
}

type CallInvitePayload = CallSignalPayload & {
    fromName: string
    fromAvatarUrl?: string | null
    fromVerified?: boolean
    kind: CallKind
}

type CallSDPPayload = CallSignalPayload & {
    sdp: RTCSessionDescriptionInit
}

type CallIceCandidatePayload = CallSignalPayload & {
    candidate: RTCIceCandidateInit
}

// Free public STUN only for now — no TURN relay, so calls between peers behind
// strict/symmetric NAT may fail to connect. Can add a TURN server here later
// without touching the signaling flow below.
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

type CallContextType = {
    state: CallState
    callKind: CallKind | null
    peer: CallPeer | null
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    isMuted: boolean
    isCameraOff: boolean
    startCall: (peer: CallPeer, kind: CallKind) => void
    acceptCall: () => void
    declineCall: () => void
    endCall: () => void
    toggleMute: () => void
    toggleCamera: () => void
}

const CallContext = createContext<CallContextType | null>(null)

export function CallProvider({ children }: { children: React.ReactNode }) {
    const socket = useSocket()
    const { user } = useAuth()

    const [state, setState] = useState<CallState>('idle')
    const [callKind, setCallKind] = useState<CallKind | null>(null)
    const [peer, setPeer] = useState<CallPeer | null>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isCameraOff, setIsCameraOff] = useState(false)

    const callIdRef = useRef<string | null>(null)
    const pcRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
    // Resolves once local media + RTCPeerConnection are ready — awaited by the
    // offer/accept handlers so an incoming signal can't race the async
    // getUserMedia() call that startCall()/acceptCall() kick off.
    const mediaReadyRef = useRef<Promise<void> | null>(null)
    const peerRef = useRef<CallPeer | null>(null)
    const callKindRef = useRef<CallKind | null>(null)
    const stateRef = useRef<CallState>('idle')

    useEffect(() => { peerRef.current = peer }, [peer])
    useEffect(() => { callKindRef.current = callKind }, [callKind])
    useEffect(() => { stateRef.current = state }, [state])

    const cleanup = useCallback(() => {
        pcRef.current?.close()
        pcRef.current = null
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
        pendingCandidatesRef.current = []
        mediaReadyRef.current = null
        callIdRef.current = null
        setLocalStream(null)
        setRemoteStream(null)
        setState('idle')
        setCallKind(null)
        setPeer(null)
        setIsMuted(false)
        setIsCameraOff(false)
    }, [])

    const createPeerConnection = useCallback((toUserId: string) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        pc.onicecandidate = (e) => {
            if (e.candidate && socket && user) {
                socket.emit('call:ice-candidate', {
                    callId: callIdRef.current,
                    toUserId,
                    fromUserId: user.id,
                    candidate: e.candidate.toJSON(),
                } as CallIceCandidatePayload)
            }
        }
        pc.ontrack = (e) => {
            setRemoteStream(e.streams[0])
        }
        pcRef.current = pc
        return pc
    }, [socket, user])

    const declineCall = useCallback(() => {
        if (socket && user && peerRef.current && callIdRef.current) {
            socket.emit('call:decline', {
                callId: callIdRef.current,
                toUserId: peerRef.current.id,
                fromUserId: user.id,
            } as CallSignalPayload)
        }
        cleanup()
    }, [socket, user, cleanup])

    const endCall = useCallback(() => {
        if (socket && user && peerRef.current && callIdRef.current) {
            socket.emit('call:end', {
                callId: callIdRef.current,
                toUserId: peerRef.current.id,
                fromUserId: user.id,
            } as CallSignalPayload)
        }
        cleanup()
    }, [socket, user, cleanup])

    const startCall = useCallback((targetPeer: CallPeer, kind: CallKind) => {
        if (!socket || !user || stateRef.current !== 'idle') return
        const callId = crypto.randomUUID()
        callIdRef.current = callId
        setPeer(targetPeer)
        setCallKind(kind)
        setState('outbound')

        mediaReadyRef.current = (async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: kind === 'video',
            })
            localStreamRef.current = stream
            setLocalStream(stream)
            const pc = createPeerConnection(targetPeer.id)
            stream.getTracks().forEach(track => pc.addTrack(track, stream))
        })()

        mediaReadyRef.current
            .then(() => {
                socket.emit('call:invite', {
                    callId,
                    toUserId: targetPeer.id,
                    fromUserId: user.id,
                    fromName: user.name,
                    fromAvatarUrl: user.profile?.avatarUrl,
                    fromVerified: user.profile?.verificationStatus === 'VERIFIED',
                    kind,
                } as CallInvitePayload)
            })
            .catch((err) => {
                console.error('Failed to get local media', err)
                cleanup()
            })
    }, [socket, user, createPeerConnection, cleanup])

    const acceptCall = useCallback(() => {
        if (!socket || !user || !peerRef.current || !callKindRef.current) return
        const kind = callKindRef.current
        const targetPeer = peerRef.current
        const callId = callIdRef.current

        mediaReadyRef.current = (async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: kind === 'video',
            })
            localStreamRef.current = stream
            setLocalStream(stream)
            const pc = createPeerConnection(targetPeer.id)
            stream.getTracks().forEach(track => pc.addTrack(track, stream))
        })()

        mediaReadyRef.current
            .then(() => {
                socket.emit('call:accept', {
                    callId,
                    toUserId: targetPeer.id,
                    fromUserId: user.id,
                } as CallSignalPayload)
            })
            .catch((err) => {
                console.error('Failed to get local media', err)
                declineCall()
            })
    }, [socket, user, createPeerConnection, declineCall])

    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current
        if (!stream) return
        const nextMuted = !isMuted
        stream.getAudioTracks().forEach(t => { t.enabled = !nextMuted })
        setIsMuted(nextMuted)
    }, [isMuted])

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current
        if (!stream) return
        const nextOff = !isCameraOff
        stream.getVideoTracks().forEach(t => { t.enabled = !nextOff })
        setIsCameraOff(nextOff)
    }, [isCameraOff])

    useEffect(() => {
        if (!socket || !user) return

        async function handleInvite(payload: CallInvitePayload) {
            if (stateRef.current !== 'idle') {
                socket!.emit('call:decline', {
                    callId: payload.callId,
                    toUserId: payload.fromUserId,
                    fromUserId: user!.id,
                } as CallSignalPayload)
                return
            }
            callIdRef.current = payload.callId
            setPeer({ id: payload.fromUserId, name: payload.fromName, avatarUrl: payload.fromAvatarUrl, verified: payload.fromVerified })
            setCallKind(payload.kind)
            setState('inbound')
        }

        async function handleAccept(payload: CallSignalPayload) {
            if (payload.callId !== callIdRef.current || !mediaReadyRef.current) return
            await mediaReadyRef.current
            const pc = pcRef.current
            if (!pc) return
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socket!.emit('call:offer', {
                callId: payload.callId,
                toUserId: payload.fromUserId,
                fromUserId: user!.id,
                sdp: offer,
            } as CallSDPPayload)
        }

        async function handleOffer(payload: CallSDPPayload) {
            if (payload.callId !== callIdRef.current || !mediaReadyRef.current) return
            await mediaReadyRef.current
            const pc = pcRef.current
            if (!pc) return
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate))
            }
            pendingCandidatesRef.current = []
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket!.emit('call:answer', {
                callId: payload.callId,
                toUserId: payload.fromUserId,
                fromUserId: user!.id,
                sdp: answer,
            } as CallSDPPayload)
            setState('active')
        }

        async function handleAnswer(payload: CallSDPPayload) {
            if (payload.callId !== callIdRef.current) return
            const pc = pcRef.current
            if (!pc) return
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate))
            }
            pendingCandidatesRef.current = []
            setState('active')
        }

        async function handleIceCandidate(payload: CallIceCandidatePayload) {
            if (payload.callId !== callIdRef.current) return
            const pc = pcRef.current
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            } else {
                pendingCandidatesRef.current.push(payload.candidate)
            }
        }

        function handleDecline(payload: CallSignalPayload) {
            if (payload.callId !== callIdRef.current) return
            cleanup()
        }

        function handleEnd(payload: CallSignalPayload) {
            if (payload.callId !== callIdRef.current) return
            cleanup()
        }

        function handleUnavailable(payload: { callId: string }) {
            if (payload.callId !== callIdRef.current) return
            cleanup()
        }

        function handleCancelled(payload: { callId: string }) {
            if (payload.callId !== callIdRef.current) return
            cleanup()
        }

        socket.on('call:invite', handleInvite)
        socket.on('call:accept', handleAccept)
        socket.on('call:offer', handleOffer)
        socket.on('call:answer', handleAnswer)
        socket.on('call:ice-candidate', handleIceCandidate)
        socket.on('call:decline', handleDecline)
        socket.on('call:end', handleEnd)
        socket.on('call:unavailable', handleUnavailable)
        socket.on('call:cancelled', handleCancelled)

        return () => {
            socket.off('call:invite', handleInvite)
            socket.off('call:accept', handleAccept)
            socket.off('call:offer', handleOffer)
            socket.off('call:answer', handleAnswer)
            socket.off('call:ice-candidate', handleIceCandidate)
            socket.off('call:decline', handleDecline)
            socket.off('call:end', handleEnd)
            socket.off('call:unavailable', handleUnavailable)
            socket.off('call:cancelled', handleCancelled)
        }
    }, [socket, user, cleanup])

    return (
        <CallContext.Provider
            value={{
                state,
                callKind,
                peer,
                localStream,
                remoteStream,
                isMuted,
                isCameraOff,
                startCall,
                acceptCall,
                declineCall,
                endCall,
                toggleMute,
                toggleCamera,
            }}
        >
            {children}
        </CallContext.Provider>
    )
}

export const useCall = () => {
    const ctx = useContext(CallContext)
    if (!ctx) throw new Error('useCall must be used inside CallProvider')
    return ctx
}
