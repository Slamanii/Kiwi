'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SeekDetailHeader, SeekDetailMeta, SeekDetailActions } from '@/components/seek/SeekDetail'
import { SeekBottomTabs } from '@/components/seek/SeekTabs'
import { CreateBidSheet } from '@/components/bid/CreateBidSheet'
import { CreateReseekSheet } from '@/components/seek/CreateReseekSheet'
import { seekApi } from '@/lib/api/seek'
import type { Comment } from '@/components/seek/CommentCard'
import type { Seek } from '@/types'
import { GavelIcon, RepostIcon, ChevronLeftIcon } from '@/components/ui/Icons'

export default function SeekDetailPage() {
    const { id }   = useParams<{ id: string }>()
    const router   = useRouter()
    const { user } = useAuth()

    const isLoggedIn = !!user
    const isAgent    = !!user?.roles?.includes('AGENT')

    const [seek,           setSeek]           = useState<Seek | null>(null)
    const [comments,       setComments]       = useState<Comment[]>([])
    const [loading,        setLoading]        = useState(true)
    const [liked,          setLiked]          = useState(false)
    const [bookmarked,     setBookmarked]     = useState(false)
    const [likedComments,  setLikedComments]  = useState<Set<string>>(new Set())
    const [likedReplies,   setLikedReplies]   = useState<Set<string>>(new Set())
    const [showBidSheet,   setShowBidSheet]   = useState(false)
    const [showReseekSheet, setShowReseekSheet] = useState(false)

    const isOwner = !!user && !!seek && seek.authorId === user.id

    const loadComments = useCallback(() => {
        if (!id) return
        seekApi.getComments(id)
            .then(res => setComments(res.data ?? []))
            .catch(console.error)
    }, [id])

    useEffect(() => {
        if (!id) return
        let cancelled = false
        setLoading(true)
        seekApi.getById(id)
            .then(res => { if (!cancelled) setSeek(res.data) })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false) })
        loadComments()
        return () => { cancelled = true }
    }, [id, loadComments])

    const requireAuth = () => router.push('/login')

    const toggleLike = async () => {
        if (!isLoggedIn) return requireAuth()
        const was = liked
        setLiked(!was)
        try {
            await seekApi.like(id)
        } catch {
            setLiked(was)
        }
    }

    const toggleBookmark = async () => {
        if (!isLoggedIn) return requireAuth()
        const was = bookmarked
        setBookmarked(!was)
        try {
            await seekApi.bookmark(id)
        } catch {
            setBookmarked(was)
        }
    }

    const handleAddComment = async (content: string, parentId?: string) => {
        if (!isLoggedIn) return requireAuth()
        try {
            await seekApi.addComment(id, content, parentId)
            loadComments()
        } catch (err) {
            console.error(err)
        }
    }

    const handleLikeComment = async (commentId: string) => {
        if (!isLoggedIn) return requireAuth()
        const was = likedComments.has(commentId)
        setLikedComments(prev => { const n = new Set(prev); was ? n.delete(commentId) : n.add(commentId); return n })
        setComments(prev => prev.map(c => c.id === commentId
            ? { ...c, likeCount: c.likeCount + (was ? -1 : 1) }
            : c
        ))
        try {
            await seekApi.likeComment(commentId)
        } catch {
            setLikedComments(prev => { const n = new Set(prev); was ? n.add(commentId) : n.delete(commentId); return n })
            setComments(prev => prev.map(c => c.id === commentId
                ? { ...c, likeCount: c.likeCount + (was ? 1 : -1) }
                : c
            ))
        }
    }

    const handleLikeReply = async (replyId: string) => {
        if (!isLoggedIn) return requireAuth()
        const was = likedReplies.has(replyId)
        setLikedReplies(prev => { const n = new Set(prev); was ? n.delete(replyId) : n.add(replyId); return n })
        setComments(prev => prev.map(c => ({
            ...c,
            replies: c.replies.map(r => r.id === replyId
                ? { ...r, likeCount: r.likeCount + (was ? -1 : 1) }
                : r
            ),
        })))
        try {
            await seekApi.likeComment(replyId)
        } catch {
            setLikedReplies(prev => { const n = new Set(prev); was ? n.add(replyId) : n.delete(replyId); return n })
            setComments(prev => prev.map(c => ({
                ...c,
                replies: c.replies.map(r => r.id === replyId
                    ? { ...r, likeCount: r.likeCount + (was ? 1 : -1) }
                    : r
                ),
            })))
        }
    }

    const handleToggleComments = async () => {
        if (!seek) return
        const was = seek.commentsEnabled
        setSeek({ ...seek, commentsEnabled: !was })
        try {
            const res = await seekApi.toggleComments(id)
            setSeek(prev => prev ? { ...prev, commentsEnabled: res.data.commentsEnabled } : prev)
        } catch (err) {
            console.error(err)
            setSeek(prev => prev ? { ...prev, commentsEnabled: was } : prev)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1C1B1A] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
        )
    }

    if (!seek) {
        return (
            <div className="min-h-screen bg-[#1C1B1A] flex items-center justify-center">
                <p className="text-white/30 text-sm">This post is no longer available.</p>
            </div>
        )
    }

    const isInfoPost = seek.type === 'INFO'

    return (
        <div className="min-h-screen bg-[#1C1B1A] text-white pb-12">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-14 pb-2">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center active:opacity-70"
                    aria-label="Back"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <span className="text-base font-semibold text-white">Post</span>
            </div>

            <SeekDetailHeader
                seek={seek}
                onViewProfile={() => router.push(`/container/fullscreen/profile/${seek.author.id}`)}
            />

            {/* Reseek (non-agents) or Bid (agents) button */}
            {!isInfoPost && (
                <div className="px-4 pt-4">
                    {isAgent ? (
                        <button
                            onClick={() => isLoggedIn ? setShowBidSheet(true) : requireAuth()}
                            className="w-full flex items-center justify-center gap-2 py-2.5
                                       bg-green-500/20 text-green-300 rounded-xl text-sm font-medium
                                       active:scale-95 transition-transform"
                        >
                            <GavelIcon className="w-4 h-4" /> bid
                        </button>
                    ) : (
                        <button
                            onClick={() => isLoggedIn ? setShowReseekSheet(true) : requireAuth()}
                            className="w-full flex items-center justify-center gap-2 py-2.5
                                       bg-cyan-400/20 text-cyan-300 rounded-xl text-sm font-medium
                                       active:scale-95 transition-transform"
                        >
                            <RepostIcon className="w-4 h-4" /> reseek
                        </button>
                    )}
                </div>
            )}

            <div className="pt-4">
                <SeekDetailMeta seek={seek} />
            </div>

            <SeekDetailActions
                likeCount={seek.likeCount}
                liked={liked}
                bookmarked={bookmarked}
                onLike={toggleLike}
                onBookmark={toggleBookmark}
                onComment={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                onShare={() => navigator.share?.({ title: 'Kiwi', url: window.location.href })}
            />

            <div className="pt-2">
                <SeekBottomTabs
                    seekId={seek.id}
                    isOwner={isOwner}
                    isInfoPost={isInfoPost}
                    comments={comments}
                    bidCount={seek.bidCount}
                    currentUserId={user?.id}
                    commentsEnabled={seek.commentsEnabled}
                    onAddComment={handleAddComment}
                    onLikeComment={handleLikeComment}
                    onLikeReply={handleLikeReply}
                    onToggleComments={handleToggleComments}
                    likedComments={likedComments}
                    likedReplies={likedReplies}
                />
            </div>

            {showBidSheet && (
                <CreateBidSheet
                    seekId={seek.id}
                    onClose={() => setShowBidSheet(false)}
                    onSuccess={() => setShowBidSheet(false)}
                />
            )}

            {showReseekSheet && (
                <CreateReseekSheet
                    seekId={seek.id}
                    onClose={() => setShowReseekSheet(false)}
                    onSuccess={() => setShowReseekSheet(false)}
                />
            )}
        </div>
    )
}
