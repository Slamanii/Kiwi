import { prisma } from '@kiwi/db'
import cron from 'node-cron'
import { AgreementItemKind, NotificationType } from '@kiwi/types'
import { notify } from '../services/notification.js'

export async function sweepAgreementCheckpoints() {
    const now = new Date()

    const dueItems = await prisma.agreementItem.findMany({
        where: {
            kind: AgreementItemKind.CHECKPOINT,
            completed: false,
            unlocksAt: { lte: now },
            notifiedAt: null,
        },
        include: { agreement: { include: { thread: true } } }
    })

    for (const item of dueItems) {
        await notify({
            userId: item.agreement.thread.clientId,
            type: NotificationType.AGREEMENT_ITEM_DUE,
            body: 'A deal checkpoint is waiting on your answer.',
            metadata: { agreementId: item.agreementId, threadId: item.agreement.threadId }
        })

        await prisma.agreementItem.update({
            where: { id: item.id },
            data: { notifiedAt: now }
        })
    }

    if (dueItems.length > 0) {
        console.log(`[JOB] Notified ${dueItems.length} overdue agreement checkpoints`)
    }
}

cron.schedule('0 10 * * *', sweepAgreementCheckpoints) // every day 10am
