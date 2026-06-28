///get firebase credentials
import { prisma } from '@kiwi/db'


interface PushPayload {
    title: string
    body: string
    data?: Record<string, string>
}

export async function sendPushNotification (
    token: string,
    payload: PushPayload
): Promise<void> {
    //initialize firebase & call await admin.messaging().send({...})

    console.log(`[FCM] Would send to token ${token.slice(0, 10)}...`, payload)
}

export async function sendPushToUser(
    userId: string,
    payload: PushPayload
): Promise<void> {

    const tokens = await prisma.deviceToken.findMany({
        where: { userId }
    })
}