import { prisma } from '@kiwi/db'
import { AgreementStatus, AgreementStage, ThreadStatus, SeekStatus, NotificationType } from '@kiwi/types'
import type { CreateAgreementInput } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from './notification.js'




export async function createAgreementForm(
    threadId: string,
    createId: string,
    data: CreateAgreementInput
) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: { agreement: true }
    })

    if (!thread) throw new Error('Thread not found')
    if (thread.clientId !== createId) throw new Error('Only the client can create the agreement')
    if (thread.agreement) throw new Error('Agreement already exists for this thread')

        return prisma.agreement.create({
            data: {
                threadId,
                agentFee: data.agentFee,
                items: {
                    create: data.items.map((item: any) => ({
                        requirement: item.requirement,
                        stage: item.stage
                    }))
                }
            },
            include: { items: true }
        })
}  


export async function answerAgreementItem(
    itemId: string,
    userId: string,
    answer: string
) {
    const item = await prisma.agreementItem.findUnique({
        where: { id: itemId },
        include: {
            agreement: {
                include: { thread: true }
            }
        }
    })
    if (!item) throw new Error('Item not found')

    const { thread } = item.agreement
    const isParticipant = thread.clientId === userId || thread.agentId === userId
    if (!isParticipant) throw new Error('Unauthorized')
    if (item.completed) throw new Error('Item already answered')

        return prisma.agreementItem.update({
            where: { id: itemId },
            data: {
                answer,
                completed: true,
                completedAt: new Date(),
                answeredBy: userId,
            }
        })
}

export async function signAgreement(agreementId: string, userId: string) {
    const agreement = await prisma.agreement.findUnique({
        where: { id: agreementId },
        include: {
            thread: true
        }
    })
    if (!agreement) throw new Error('Agreement not found')

    const { thread } = agreement
    const isClient = thread.clientId === userId
    const isAgent = thread.agentId === userId
    if (!isClient && !isAgent) throw new Error('Unauthorized')


    if (isClient && agreement.clientSignedAt) throw new Error('Already signed')
    if (isAgent && agreement.agentSignedAt) throw new Error('Already signed')

        const updateData: any = isClient
            ? { clientSignedAt: new Date(), clientSignature: userId }
            : { agentSignedAt: new Date(), agentSignature: userId }

        const updated = await prisma.agreement.update({
            where: { id: agreementId },
            data: updateData,
            include: { thread: true }
        })

        if (updated.clientSignedAt && updated.agentSignedAt) {
            await prisma.agreement.update({
                where: { id: agreementId },
                data: { status: AgreementStatus.SIGNED}
            })
            //TODO: generate pdf here
        }
        return updated
}


export async function getAgreementByThread(threadId: string, userId: string) {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } })
    if (!thread) throw new Error('Thread not found')

        const isParticipant = thread.clientId === userId || thread.agentId === userId
        if (!isParticipant) throw new Error('Unauthorized')

            return prisma.agreement.findUnique({
                where: { threadId },
                include: {
                    items: {
                        orderBy: { stage: 'asc' }
                    }
                }
            })
}

export async function completeAgreement(agreementId: string, clientId: string) {
    const agreement = await prisma.agreement.findUnique({
        where: { id: agreementId },
        include: {
            thread: true,
            items: true,
        } 
    })

    if (!agreement) throw new Error('Agreement not found')
    if (agreement.thread.clientId !== clientId) {
        throw new Error('Unauthorized')
    }
    if (agreement.status !== AgreementStatus.IN_PROGRESS) {
        throw new Error('Agreement is not in progress')
    }

    const incomplete = agreement.items.filter(
        (item: any) => item.stage !== AgreementStage.AFTER && !item.completed
    )

    if (incomplete.length > 0) {
        throw new Error(`${incomplete.length} requirements still incomplete`)
    }

    await prisma.$transaction(async (tx: any) => {
        await tx.agreement.update({
            where: { id: agreementId },
            data: { status: AgreementStatus.COMPLETED }
        })

    await tx.profile.update({
        where: { userId: agreement.thread.agentId || agreement.thread.clientId},
        data: {
            completedDeals: { increment: 1 },
            ongoing: { decrement: 1 }
         }
    })
    await tx.thread.update({
        where: { id: agreement.threadId },
        data: { status: ThreadStatus.CLOSED }
    })

    await tx.seek.update({
        where: { id: agreement.thread.seekId },
        data: { status: SeekStatus.DEPRECATED }
    })
  })

  const clientProfile = await prisma.profile.findUnique({
        where: { userId: agreement.thread.clientId }
    })
    getIO().to(`profile:${agreement.thread.clientId}`).emit('profile:statsUpdated', {
        userId: agreement.thread.clientId,
        requests: clientProfile?.requests,
        ongoing: clientProfile?.ongoing,
        completedDeals: clientProfile?.completedDeals,
    })

    getIO().to(`thread:${agreement.threadId}`).emit('thread:completed', {
        threadId: agreement.threadId,
        agreementId,
    })

    await notify({
        userId: agreement.thread.agentId,
        type: NotificationType.AGREEMENT_SIGNED,
        body: 'Your agreement has been completed',
        metadata: { agreementId, threadId: agreement.threadId }
    })

    await notify({
        userId: agreement.thread.clientId,
        type: NotificationType.AGREEMENT_SIGNED,
        body: 'Your agreement has been completed',
        metadata: { agreementId, threadId: agreement.threadId }
    })

}