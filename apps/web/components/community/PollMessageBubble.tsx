'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { pollApi } from '@/lib/api/poll'
import type { Poll, PollResults } from '@/types'

type PollMessageBubbleProps = {
    poll: Poll
    isSent: boolean
    timestamp: string
    senderName?: string
    senderAvatarUrl?: string | null
    senderVerified?: boolean
}

export default function PollMessageBubble({ poll, isSent, timestamp, senderName, senderAvatarUrl, senderVerified }: PollMessageBubbleProps) {
    const showSenderInfo = !!senderName && !isSent
    const [results, setResults] = useState<PollResults | null>(null)
    const [selected, setSelected] = useState<string[]>([])
    const [voting, setVoting] = useState(false)
    const [deleted, setDeleted] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        pollApi.getResults(poll.id).then(res => {
            setResults(res.data)
            setSelected(res.data.options.filter((o: PollResults['options'][number]) => o.votedByMe).map((o: PollResults['options'][number]) => o.id))
        })
    }, [poll.id])

    const handleDelete = async () => {
        if (deleting || !confirm('Delete this poll? This removes it for everyone.')) return
        setDeleting(true)
        try {
            await pollApi.delete(poll.id)
            setDeleted(true)
        } catch {
            setDeleting(false)
        }
    }

    if (deleted) return null

    const closed = !!poll.closesAt && new Date(poll.closesAt) < new Date()
    const hasVoted = (results?.options ?? []).some(o => o.votedByMe)
    const displayOptions = results?.options ?? poll.options.map(o => ({ id: o.id, text: o.text, voteCount: 0, percentage: 0, votedByMe: false }))

    const toggleOption = (optionId: string) => {
        if (closed || voting || hasVoted) return
        setSelected(prev => {
            if (poll.allowMultiple) {
                return prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
            }
            return [optionId]
        })
    }

    const submitVote = async () => {
        if (selected.length === 0 || voting) return
        setVoting(true)
        try {
            const res = await pollApi.vote(poll.id, selected)
            setResults(res.data)
        } finally {
            setVoting(false)
        }
    }

    return (
        <div className={`flex px-4 py-1 gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
            {showSenderInfo && (
                <div className="shrink-0 self-end">
                    <Avatar src={senderAvatarUrl} name={senderName} size="sm" />
                </div>
            )}
            <div className="max-w-[80%] w-72">
                {showSenderInfo && (
                    <div className="flex items-center gap-1 text-white/40 text-[11px] mb-1 pl-1">
                        {senderName}
                        {senderVerified && <VerifiedBadge size="xs" />}
                    </div>
                )}
                <div className={`px-3.5 py-3 ${isSent ? 'bg-blue-500 rounded-[18px_18px_4px_18px]' : 'bg-[#1c1c1e] rounded-[18px_18px_18px_4px]'}`}>
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-semibold flex items-center gap-1.5">
                            <span>📊</span> {poll.question}
                        </p>
                        {/* Stub for the shared message-action modal (copy/reply/delete/pin/select) planned
                            across all message types — until that lands, this is poll delete's own trigger. */}
                        {isSent && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="text-white/40 text-sm leading-none px-1 shrink-0 disabled:opacity-40"
                            >
                                ⋯
                            </button>
                        )}
                    </div>

                    <div className="mt-2.5 space-y-1.5">
                        {displayOptions.map(opt => {
                            const isSelected = selected.includes(opt.id)
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleOption(opt.id)}
                                    disabled={closed || voting || hasVoted}
                                    className={`relative w-full text-left rounded-lg overflow-hidden border transition-colors
                                        ${isSelected ? 'border-white/60' : 'border-white/10'} disabled:cursor-default`}
                                >
                                    {hasVoted && (
                                        <div
                                            className="absolute inset-y-0 left-0 bg-white/15"
                                            style={{ width: `${opt.percentage}%` }}
                                        />
                                    )}
                                    <div className="relative flex items-center justify-between px-2.5 py-1.5 gap-2">
                                        <span className="text-white/90 text-xs">{opt.text}</span>
                                        {hasVoted && (
                                            <span className="text-white/50 text-[11px] shrink-0">{opt.percentage}%</span>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                        <span className="text-white/40 text-[11px]">
                            {results ? `${results.totalVotes} vote${results.totalVotes === 1 ? '' : 's'}` : ''}
                            {closed ? ' · Closed' : ''}
                        </span>
                        {!hasVoted && !closed && (
                            <button
                                onClick={submitVote}
                                disabled={selected.length === 0 || voting}
                                className="text-[11px] font-semibold text-white bg-white/15 px-3 py-1 rounded-full disabled:opacity-40"
                            >
                                {voting ? 'Voting…' : 'Vote'}
                            </button>
                        )}
                    </div>
                </div>
                <div className={`text-white/30 text-[11px] mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                    {timestamp}
                </div>
            </div>
        </div>
    )
}
