'use client'

import { useCall } from '@/context/CallContext'
import IncomingCallSheet from './IncomingCallSheet'
import AudioCall from './AudioCall'
import VideoCall from './VideoCall'

export default function CallOverlay() {
    const { state, callKind } = useCall()

    if (state === 'idle') return null
    if (state === 'inbound') return <IncomingCallSheet />
    return callKind === 'video' ? <VideoCall /> : <AudioCall />
}
