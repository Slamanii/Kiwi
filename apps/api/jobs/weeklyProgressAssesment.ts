import { prisma } from '@kiwi/db'
import cron from 'node-cron'
import { notify } from '../services/notification.js'
import { createPendingAssessments } from '../services/assessment.js'
import { getWeekNumber } from '../utils/date.js'
import { NotificationType } from '@kiwi/db'

async function sendWeeklyPAPrompts() {
    const now = new Date()
    const weekNumber = getWeekNumber(now)
    const year = now.getFullYear()

    const activeThreads = await prisma.thread.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, clientId: true, agentId: true }
    })

    for (const thread of activeThreads) {
        await createPendingAssessments(thread.id, thread.clientId, thread.agentId)
        await checkStuckThread(thread.id, weekNumber, year, thread.clientId, thread.agentId)

        await Promise.all([
            notify({ userId: thread.clientId, type: NotificationType.PA_DUE, body: 'Weekly check-in: how is your housing search going?', metadata: { threadId: thread.id } }),
            notify({ userId: thread.agentId, type: NotificationType.PA_DUE, body: 'Weekly check-in due for an active thread.', metadata: { threadId: thread.id } })
        ])
    }
}

async function checkStuckThread(threadId: string, weekNumber: number, year: number, clientId: string, agentId: string) {
    const stuckCount = await prisma.progressAssessment.count({
        where: {
            threadId,
            year,
            weekNumber: { gte: weekNumber - 2 },
            healthTags: { has: 'NOT_GOING_ANYWHERE' }
        }
    })

    if (stuckCount >= 4) {
        await Promise.all([
            notify({ userId: clientId, type: NotificationType.THREAD_STALLED, body: 'This thread seems stalled. Consider ending it to explore other options.', metadata: { threadId } }),
            notify({ userId: agentId, type: NotificationType.THREAD_STALLED, body: 'This thread has been flagged as stalled by both parties.', metadata: { threadId } })
        ])
    }
}

cron.schedule('0 9 * * 1', sendWeeklyPAPrompts) // every Monday 9am
export { sendWeeklyPAPrompts }