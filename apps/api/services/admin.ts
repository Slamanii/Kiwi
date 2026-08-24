import { UserRole, ApplicationStatus, NotificationType, ThreadStatus, AgreementStatus, VerificationStatus } from '@kiwi/types'
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


export async function approveAgentApplication(applicationId: string) {
    const application = await prisma.agentApplication.findUnique({
        where: { id: applicationId }
    })
    if (!application) throw new Error('Application not found')
    if (application.status !== ApplicationStatus.PENDING) {
        throw new Error('Application is no longer pending')
    }

    await prisma.$transaction(async (tx: any) => {
        await tx.agentApplication.update({
            where: { id: applicationId },
            data: { status: ApplicationStatus.APPROVED, reviewedAt: new Date() }
        })

        await tx.user.update({
            where: { id: application.userId },
            data: { roles: { push: UserRole.AGENT } }
        })
    })

    await notify({
        userId: application.userId,
        type: NotificationType.APPLICATION_APPROVED,
        title: 'Application Approved',
        body: 'Congratulations! Your agent application was approved',
        metadata: { applicationId }
    })
}

export async function getVerificationRequests(status?: ApplicationStatus, cursor?: string, limit = 20) {
    const requests = await prisma.verificationRequest.findMany({
        take: limit + 1,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        where: { ...(status && { status }) },
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

    const hasMore = requests.length > limit
    if (hasMore) requests.pop()

    return {
        requests,
        nextCursor: hasMore ? requests[requests.length - 1].id : null
    }
}

export async function approveVerificationRequest(requestId: string) {
    const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId }
    })
    if (!request) throw new Error('Verification request not found')
    if (request.status !== ApplicationStatus.PENDING) {
        throw new Error('Request is no longer pending')
    }

    await prisma.$transaction(async (tx: any) => {
        await tx.verificationRequest.update({
            where: { id: requestId },
            data: { status: ApplicationStatus.APPROVED, reviewedAt: new Date() }
        })

        await tx.user.update({
            where: { id: request.userId },
            data: { verificationStatus: VerificationStatus.VERIFIED }
        })
    })

    await notify({
        userId: request.userId,
        type: NotificationType.VERIFICATION_APPROVED,
        title: 'Verification Approved',
        body: 'Your identity has been verified',
        metadata: { requestId }
    })
}

export async function rejectVerificationRequest(requestId: string, reason?: string) {
    const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId }
    })
    if (!request) throw new Error('Verification request not found')
    if (request.status !== ApplicationStatus.PENDING) {
        throw new Error('Request is no longer pending')
    }

    await prisma.$transaction(async (tx: any) => {
        await tx.verificationRequest.update({
            where: { id: requestId },
            data: {
                status: ApplicationStatus.REJECTED,
                rejectionReason: reason ?? undefined,
                reviewedAt: new Date(),
            }
        })

        await tx.user.update({
            where: { id: request.userId },
            data: { verificationStatus: VerificationStatus.UNVERIFIED }
        })
    })

    await notify({
        userId: request.userId,
        type: NotificationType.VERIFICATION_REJECTED,
        title: 'Verification Rejected',
        body: reason ?? 'Your verification request was not approved',
        metadata: { requestId }
    })
}

export async function promoteToAdmin(targetUserId: string) {
    const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, roles: true }
    })
    if (!user) throw new Error('User not found')
    if (user.roles.includes(UserRole.ADMIN)) throw new Error('User is already an admin')

    await prisma.user.update({
        where: { id: targetUserId },
        data: { roles: { push: UserRole.ADMIN } }
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
    const [totalUsers, totalSeeks, activeThreads, closedThreads, closedDeals] = await Promise.all([
        prisma.user.count(),
        prisma.seek.count(),
        prisma.thread.count({ where: { status: ThreadStatus.ACTIVE } }),
        prisma.thread.count({ where: { status: ThreadStatus.CLOSED } }),
        prisma.agreement.count({ where: { status: AgreementStatus.COMPLETED } }),
    ])

    return { totalUsers, totalSeeks, activeThreads, closedThreads, closedDeals }
}