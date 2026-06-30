import { UserRole, ApplicationStatus, NotificationType, ThreadStatus, AgreementStatus } from '@kiwi/types'
import { prisma } from '@kiwi/db'
import { notify } from './notification.js'

export async function getApplications(status?: ApplicationStatus, cursor?: string, limit = 20) {
    const applications = await prisma.agentApplication.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: { ...(status && { status })},
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile: {
                        select: { avatarUrl: true, location: true }
                    }
                }
            }
        }
    })

    const hasMore = applications.length > limit
    if (hasMore) applications.pop()

        return {
            applications,
            nextCursor: hasMore ? applications[applications.length - 1].id : null
        }
}

export async function rejectAgentApplication(applicationId: string, reason?: string) {
    const application = await prisma.agentApplication.findUnique({
        where: { id: applicationId }
    })
    if (!application) throw new Error('Application not found')
    if (application.status !== ApplicationStatus.PENDING) {
        throw new Error('Application is no longer pending')
    }

    await prisma.agentApplication.update({ 
        where: { id: applicationId },
        data: {
            status: ApplicationStatus.REJECTED,
            rejectionReason: reason ?? undefined,
        }
    })

    await notify({
        userId: application.userId,
        type: NotificationType.APPLICATION_REJECTED,
        title: "Rejected",
        body: reason ?? 'Your agent application was not approved',
        metadata: { applicationId }
    })

}


export async function banUser(targetUserId: string) {
    const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { roles: true }
    })
    if (!user) throw new Error('User not found')
    if (user.roles.includes(UserRole.DEVELOPER)) throw new Error('Cannot ban a developer')

    await prisma.user.update({
        where: { id: targetUserId },
        data: { isBanned: true }
    })

    await notify({
        userId: targetUserId,
        type: NotificationType.ACCOUNT_BANNED,
        title: 'Ban',
        body: 'Your account has been suspended',
        metadata: {}
    })
}

export async function getDashboardStats() {
    const [totalUsers, totalSeeks, activeThreads, closedDeals] = await Promise.all([
        prisma.user.count(),
        prisma.seek.count(),
        prisma.thread.count({ where: { status: ThreadStatus.ACTIVE } }),
        prisma.agreement.count({ where: { status: AgreementStatus.COMPLETED } }),
    ])

    return { totalUsers, totalSeeks, activeThreads, closedDeals }
}