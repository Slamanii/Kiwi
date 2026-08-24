import { prisma } from '@kiwi/db'
import { SeekStatus, NotificationType } from '@kiwi/types'
import { getIO } from '../utils/socket.js'
import { notify } from '../services/notification.js'

export async function expireSeeks() {
    const now = new Date()

    const seeks = await prisma.seek.findMany({
        where: {
            status: SeekStatus.OPEN,
            expiresAt: { lte: now }
        },
        take: 5,
        select: { id: true, authorId: true }
    }) 

    if (seeks.length === 0) return

    await prisma.$transaction(
        seeks.map(seek => 
            prisma.seek.update({ 
            where: { id: seek.id },
            data: { status: SeekStatus.EXPIRED}
            })
        )
    )

    await Promise.allSettled(
        seeks.map(async (seek) => {
            getIO().emit('seek:expired', { seekdId: seek.id })

            await notify({
                userId: seek.authorId,
                type: NotificationType.SYSTEM,
                title: 'Your seek has expired',
                body: 'Your seek has expired and is no longer visible on the feed',
                metadata: { seekId: seek.id }
            })
        })
    )

    console.log(`[JOB] Expired ${seeks.length} seeks`)
}


{/**
    const expiryMap = {
  '1_WEEK': 7,
  '2_WEEKS': 14,
  '1_MONTH': 30,
  '3_MONTHS': 90,
}

const expiresAt = new Date()
expiresAt.setDate(expiresAt.getDate() + expiryMap[input.expiryOption]) 
    */}