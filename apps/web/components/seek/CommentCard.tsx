'use client'
import { formatTime } from '@/lib/utils'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'


export type Reply = {
    id: string
    content: string
    likeCount: number
    createdAt: string
    author: {
        id: string
        name: string
        profile?: { avatarUrl?: string; verificationStatus?: string }
    }
}

type ReplyCardProps = {
    reply: Reply
    onLike?: () => void
    liked?: boolean
}



export type Comment = {
    id: string
    content: string
    likeCount: number
    createdAt: string
    author: {
        id: string
        name: string
        profile?: { avatarUrl?: string; verificationStatus?: string }
    }
    replies: Reply[]
}

type CommentCardProps = {
    comment: Comment
    onLike?: () => void
    onReplyLike?: (replyId: string) => void
    onReply?: (content: string) => void
    liked?: boolean
    likedReplies?: Set<string>
}


type CommentSectionProps = {
    comments: Comment[]
    currentUserId?: string
    isOwner?: boolean
    onAddComment?: (content: string, parentId?: string) => void
    onLikeComment?: (commentId: string) => void
    onLikeReply?: (replyId: string) => void
    onToggleComments?: () => void
    likedComments?: Set<string>
    likedReplies?: Set<string>
    commentsEnabled?: boolean
}

export function CommentSection({
    comments,
    currentUserId,
    isOwner,
    onAddComment,
    onLikeComment,
    onLikeReply,
    onToggleComments,
    likedComments,
    likedReplies,
    commentsEnabled = true,
}: CommentSectionProps) {
    const [text, setText] = useState('')

    const handleSubmit = () => {
        if (!text.trim()) return
        onAddComment?.(text.trim())
        setText('')
    }

    return (
        <div className="space-y-4" id="comments">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-semibold text-white">
                    Comments {comments.length > 0 && `(${comments.length})`}
                </h3>
                {isOwner && (
                    <button
                        onClick={onToggleComments}
                        className="text-xs text-gray-500 active:text-gray-300"
                    >
                        {commentsEnabled ? 'Turn off comments' : 'Turn on comments'}
                    </button>
                )}
            </div>

            {/* Comment input */}
            {commentsEnabled && currentUserId ? (
                <div className="flex gap-2 px-4">
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm
                                   text-white placeholder:text-gray-600
                                   focus:outline-none focus:ring-1 focus:ring-white/20"
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                    <button
                        onClick={handleSubmit}
                        className="text-sm text-green-400 font-medium"
                    >
                        Post
                    </button>
                </div>
            ) : !commentsEnabled ? (
                <div className="mx-4 py-3 rounded-xl bg-yellow-900/30 text-center">
                    <span className="text-xs text-yellow-500">
                        👑 Comments are disabled on this post
                    </span>
                </div>
            ) : null}

            {/* Comment list */}
            <div className="space-y-5 px-4">
                {comments.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                        No comments yet. Be the first.
                    </p>
                ) : (
                    comments.map(comment => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            onLike={() => onLikeComment?.(comment.id)}
                            onReplyLike={(replyId) => onLikeReply?.(replyId)}
                            onReply={(content) => onAddComment?.(content, comment.id)}
                            liked={likedComments?.has(comment.id)}
                            likedReplies={likedReplies}
                        />
                    ))
                )}
            </div>
        </div>
    )
}



export function CommentCard({
    comment,
    onLike,
    onReplyLike,
    onReply,
    liked,
    likedReplies,
}: CommentCardProps) {
    const [showReplies, setShowReplies] = useState(false)
    const [showReplyInput, setShowReplyInput] = useState(false)
    const [replyText, setReplyText] = useState('')

    const handleSubmitReply = () => {
        if (!replyText.trim()) return
        onReply?.(replyText.trim())
        setReplyText('')
        setShowReplyInput(false)
        setShowReplies(true)
    }

    return (
        <div className="space-y-3">
            {/* Top-level comment */}
            <div className="flex gap-2.5">
                <Avatar
                    src={comment.author.profile?.avatarUrl}
                    name={comment.author.name}
                    size="sm"
                />
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">
                            {comment.author.name}
                        </span>
                        {comment.author.profile?.verificationStatus === 'VERIFIED' && (
                            <VerifiedBadge size="xs" />
                        )}
                        <span className="text-xs text-gray-500">
                            {formatTime(comment.createdAt)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onLike}
                            className="flex items-center gap-1 active:scale-95 transition-transform"
                        >
                            <span className={`text-sm ${liked ? 'text-green-400' : 'text-gray-500'}`}>
                                {liked ? '♥' : '♡'}
                            </span>
                            {comment.likeCount > 0 && (
                                <span className="text-xs text-gray-500">{comment.likeCount}</span>
                            )}
                        </button>

                        <button
                            onClick={() => setShowReplyInput(v => !v)}
                            className="text-xs text-gray-500 active:text-gray-300"
                        >
                            Reply
                        </button>

                        {comment.replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(v => !v)}
                                className="text-xs text-gray-500 active:text-gray-300"
                            >
                                {showReplies
                                    ? 'Hide replies'
                                    : `${comment.replies.length} repl${comment.replies.length > 1 ? 'ies' : 'y'}`
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply input */}
            {showReplyInput && (
                <div className="flex gap-2 pl-10">
                    <input
                        autoFocus
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-white/5 rounded-full px-3 py-1.5 text-xs
                                   text-white placeholder:text-gray-600
                                   focus:outline-none focus:ring-1 focus:ring-white/20"
                        onKeyDown={e => e.key === 'Enter' && handleSubmitReply()}
                    />
                    <button
                        onClick={handleSubmitReply}
                        className="text-xs text-green-400 font-medium"
                    >
                        Send
                    </button>
                </div>
            )}

            {/* Replies */}
            {showReplies && comment.replies.length > 0 && (
                <div className="space-y-3">
                    {comment.replies.map(reply => (
                        <ReplyCard
                            key={reply.id}
                            reply={reply}
                            onLike={() => onReplyLike?.(reply.id)}
                            liked={likedReplies?.has(reply.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}



export function ReplyCard({ reply, onLike, liked }: ReplyCardProps) {
    return (
        <div className="flex gap-2.5 pl-10">
            <Avatar
                src={reply.author.profile?.avatarUrl}
                name={reply.author.name}
                size="sm"
            />
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">
                        {reply.author.name}
                    </span>
                    {reply.author.profile?.verificationStatus === 'VERIFIED' && (
                        <VerifiedBadge size="xs" />
                    )}
                    <span className="text-xs text-gray-500">
                        {formatTime(reply.createdAt)}
                    </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                    {reply.content}
                </p>
                <button
                    onClick={onLike}
                    className="flex items-center gap-1 active:scale-95 transition-transform"
                >
                    <span className={`text-sm ${liked ? 'text-green-400' : 'text-gray-500'}`}>
                        {liked ? '♥' : '♡'}
                    </span>
                    {reply.likeCount > 0 && (
                        <span className="text-xs text-gray-500">{reply.likeCount}</span>
                    )}
                </button>
            </div>
        </div>
    )
}