import { getIO } from '../utils/socket.js'
import { prisma } from '@kiwi/db'
import  { PAMilestone, PAHealthTag, PAMood } from '@kiwi/types'
import { getWeekNumber } from '../utils/date.js'




export async function createPendingAssessments(threadId: string, clientId: string, agentId: string) {
    const now = new Date()
    const weekNumber = getWeekNumber(now)
    const year = now.getFullYear()

    // create pending PA for both participants if not already exists this week
    await Promise.all([
        prisma.progressAssessment.upsert({
            where: { threadId_userId_weekNumber_year: { threadId, userId: clientId, weekNumber, year } },
            create: { threadId, userId: clientId, weekNumber, year },
            update: {}
        }),
        prisma.progressAssessment.upsert({
            where: { threadId_userId_weekNumber_year: { threadId, userId: agentId, weekNumber, year } },
            create: { threadId, userId: agentId, weekNumber, year },
            update: {}
        })
    ])
}

export async function getThreadProgress(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        select: { clientId: true, agentId: true }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')

    const now = new Date()
    const weekNumber = getWeekNumber(now)
    const year = now.getFullYear()

    const [milestones, assessments, pendingThisWeek] = await Promise.all([
        prisma.threadMilestone.findMany({
            where: { threadId },
            orderBy: { reachedAt: 'asc' }
        }),
        prisma.progressAssessment.findMany({
            where: { threadId },
            orderBy: { createdAt: 'desc' },
            take: 8
        }),
        prisma.progressAssessment.findFirst({
            where: { threadId, userId, weekNumber, year, submittedAt: null }
        })
    ])

    return {
        milestones,
        assessments,
        pendingAssessment: pendingThisWeek ?? null  // frontend checks this — if non-null, show sheet
    }
}

export async function submitAssessment(
    threadId: string,
    userId: string,
    data: {
        mood: PAMood
        healthTags: PAHealthTag[]
        milestones: PAMilestone[]
        comment?: string
    }
) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        select: { clientId: true, agentId: true }
    })
    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== userId && thread.agentId !== userId) throw new Error('Unauthorized')

    const now = new Date()
    const weekNumber = getWeekNumber(now)
    const year = now.getFullYear()

    await prisma.$transaction(async (tx) => {
        await tx.progressAssessment.upsert({
            where: { threadId_userId_weekNumber_year: { threadId, userId, weekNumber, year } },
            create: {
                threadId, userId, weekNumber, year,
                mood: data.mood as any,
                healthTags: data.healthTags as any,
                comment: data.comment ?? null,
                submittedAt: new Date()
            },
            update: {
                mood: data.mood as any,
                healthTags: data.healthTags as any,
                comment: data.comment ?? null,
                submittedAt: new Date()
            }
        })

        for (const milestone of data.milestones) {
            await tx.threadMilestone.upsert({
                where: { threadId_milestone: { threadId, milestone: milestone as any } },
                create: { threadId, milestone: milestone as any, reachedBy: userId },
                update: {}
            })
        }
    })

    getIO().to(`thread:${threadId}`).emit('thread:assessmentUpdated', {
        threadId, userId, weekNumber
    })
}