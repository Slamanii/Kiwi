import { prisma } from '@kiwi/db'
import { CommunityRole, CommunityMessagingMode, MessageType, CreatePollInput } from '@kiwi/types'
import { getIO } from '../utils/socket.js'

async function assertCanPost(communityId: string, userId: string) {
    const [membership, community] = await Promise.all([
        prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
            select: { role: true, canPost: true }
        }),
        prisma.community.findUnique({ where: { id: communityId }, select: { messagingMode: true } })
    ])

    if (!membership) throw new Error('You are not a member of this community')
    if (!community) throw new Error('Community not found')

    const canSend =
        membership.role === CommunityRole.ADMIN ||
        community.messagingMode === CommunityMessagingMode.ALL_MEMBERS ||
        (community.messagingMode === CommunityMessagingMode.SELECTED_MEMBERS && membership.canPost)

    if (!canSend) throw new Error('Only admins can post in this community')
}

export async function createPoll(communityId: string, creatorId: string, data: CreatePollInput) {
    await assertCanPost(communityId, creatorId)

    const message = await prisma.$transaction(async (tx: any) => {
        const poll = await tx.poll.create({
            data: {
                communityId,
                creatorId,
                question: data.question,
                allowMultiple: data.allowMultiple ?? false,
                closesAt: data.closesAt ? new Date(data.closesAt) : null,
                options: { create: data.options.map((text, order) => ({ text, order })) }
            }
        })

        const created = await tx.communityMessage.create({
            data: {
                communityId,
                senderId: creatorId,
                type: MessageType.POLL,
                pollId: poll.id,
            },
            include: {
                sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                poll: { include: { options: { orderBy: { order: 'asc' } } } }
            }
        })

        await tx.community.update({
            where: { id: communityId },
            data: { lastMessage: `📊 ${data.question}`, lastMessageAt: new Date() }
        })

        return created
    }, { timeout: 15000 })

    getIO().to(`community:${communityId}`).emit('message:new', message)

    return message
}

export async function deletePoll(pollId: string, userId: string) {
    const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: { message: { select: { id: true } } }
    })
    if (!poll) throw new Error('Poll not found')

    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: poll.communityId, userId } },
        select: { role: true }
    })
    const isCreator = poll.creatorId === userId
    const isAdmin = membership?.role === CommunityRole.ADMIN
    if (!isCreator && !isAdmin) throw new Error('Only the poll creator or a community admin can delete this poll')

    const messageId = poll.message?.id

    await prisma.$transaction(async (tx: any) => {
        if (messageId) await tx.communityMessage.delete({ where: { id: messageId } })
        await tx.poll.delete({ where: { id: pollId } })
    })

    getIO().to(`community:${poll.communityId}`).emit('poll:deleted', { pollId, messageId })
    if (messageId) {
        getIO().to(`community:${poll.communityId}`).emit('message:deleted', {
            conversationType: 'COMMUNITY',
            conversationId: poll.communityId,
            messageIds: [messageId]
        })
    }

    return { pollId, messageId }
}

export async function votePoll(pollId: string, userId: string, optionIds: string[]) {
    const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: { options: true }
    })
    if (!poll) throw new Error('Poll not found')
    if (poll.closesAt && poll.closesAt < new Date()) throw new Error('This poll is closed')
    if (optionIds.length === 0) throw new Error('Select at least one option')
    if (!poll.allowMultiple && optionIds.length > 1) throw new Error('This poll only allows one choice')

    const validIds = new Set(poll.options.map((o: { id: string }) => o.id))
    if (optionIds.some(id => !validIds.has(id))) throw new Error('Invalid option')

    const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: poll.communityId, userId } }
    })
    if (!membership) throw new Error('You are not a member of this community')

    await prisma.$transaction(async (tx: any) => {
        await tx.pollVote.deleteMany({ where: { pollId, userId } })
        await tx.pollVote.createMany({
            data: optionIds.map(optionId => ({ pollId, optionId, userId }))
        })
    })

    const results = await getPollResults(pollId, userId)
    getIO().to(`community:${poll.communityId}`).emit('poll:update', results)
    return results
}

export async function getPollResults(pollId: string, userId: string) {
    const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
            options: {
                orderBy: { order: 'asc' },
                include: { votes: { select: { userId: true } } }
            }
        }
    })
    if (!poll) throw new Error('Poll not found')

    const totalVotes = poll.options.reduce((sum: number, o: { votes: unknown[] }) => sum + o.votes.length, 0)

    return {
        id: poll.id,
        question: poll.question,
        allowMultiple: poll.allowMultiple,
        closesAt: poll.closesAt,
        totalVotes,
        options: poll.options.map((o: { id: string; text: string; votes: { userId: string }[] }) => ({
            id: o.id,
            text: o.text,
            voteCount: o.votes.length,
            percentage: totalVotes === 0 ? 0 : Math.round((o.votes.length / totalVotes) * 100),
            votedByMe: o.votes.some(v => v.userId === userId)
        }))
    }
}
