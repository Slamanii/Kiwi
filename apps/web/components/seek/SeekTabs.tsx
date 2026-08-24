'use client'

import { useState } from 'react'
import { CommentSection, type Comment } from '@/components/seek/CommentCard'
import { BidList } from '@/components/bid/BidList'

interface SeekBottomTabsProps {
    seekId: string
    isOwner: boolean
    isInfoPost?: boolean
    comments: Comment[]
    bidCount?: number
    currentUserId?: string
    commentsEnabled?: boolean
    onAddComment?: (content: string, parentId?: string) => void
    onLikeComment?: (commentId: string) => void
    onLikeReply?: (replyId: string) => void
    onToggleComments?: () => void
    likedComments?: Set<string>
    likedReplies?: Set<string>
}

type Tab = 'comments' | 'bids'

export function SeekBottomTabs({
    seekId,
    isOwner,
    isInfoPost,
    comments,
    bidCount,
    currentUserId,
    commentsEnabled,
    onAddComment,
    onLikeComment,
    onLikeReply,
    onToggleComments,
    likedComments,
    likedReplies,
}: SeekBottomTabsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('comments')

    return (
        <div className="space-y-4">
            {/* Tab switcher — info posts have no bids, so comments are the only view */}
            {!isInfoPost && (
                <div className="flex items-center gap-1 mx-4 bg-white/5 rounded-2xl p-1">
                    {(['comments', 'bids'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all
                                ${activeTab === tab
                                    ? 'bg-white text-black'
                                    : 'text-white/40'
                                }`}
                        >
                            {tab} ({tab === 'comments' ? comments.length : bidCount ?? 0})
                        </button>
                    ))}
                </div>
            )}

            {/* Tab content */}
            {isInfoPost || activeTab === 'comments' ? (
                <CommentSection
                    comments={comments}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    commentsEnabled={commentsEnabled}
                    onAddComment={onAddComment}
                    onLikeComment={onLikeComment}
                    onLikeReply={onLikeReply}
                    onToggleComments={onToggleComments}
                    likedComments={likedComments}
                    likedReplies={likedReplies}
                />
            ) : isOwner ? (
                <BidList seekId={seekId} isOwner={isOwner} currentUserId={currentUserId} />
            ) : (
                <div className="mx-4 py-8 rounded-2xl bg-white/3 border border-white/5 text-center">
                    <p className="text-white/30 text-sm">
                        This is not your post — you can't see bids.
                    </p>
                </div>
            )}
        </div>
    )
}