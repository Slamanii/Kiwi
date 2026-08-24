'use client'

import TabPicker from '@/components/chat/TabPicker'
import ChatHeader from '@/components/chat/ChatHeader'

export default function ArchivedPage() {
    return (
        <div className="min-h-full">
            <ChatHeader title="Archived" />
            <TabPicker />
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <span className="text-4xl mb-3">🗄️</span>
                <h1 className="text-lg font-semibold text-white">Archived</h1>
                <p className="mt-1 text-sm text-white/40">Coming soon.</p>
            </div>
        </div>
    )
}
