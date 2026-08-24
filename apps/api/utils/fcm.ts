///get firebase credentials
import { prisma } from '@kiwi/db'
import admin from 'firebase-admin'
import { config } from '../config.js'

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: config.FIREBASE_PROJECT_ID,
            clientEmail: config.FIREBASE_CLIENT_EMAIL,
            privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    })
}
interface PushPayload {
    title: string
    body: string
    data?: Record<string, string>
}

export async function sendPushNotification (
    token: string,
    payload: PushPayload
): Promise<void> {
    try {
       const link = payload.data?.url
           ? `${config.APP_URL}${payload.data.url}`
           : config.APP_URL

       await admin.messaging().send({
        token,
        notification: {
            title: payload.title,
            body: payload.body,
        },
        data: payload.data,
        webpush: {
            fcmOptions: { link }
        }
       })
    } catch (err) {
            console.error(`[FCM] Failed to send to token ${token.slice(0, 10)}...`, err)

    }
}

export async function sendPushToUser(
    userId: string,
    payload: PushPayload
): Promise<void> {

    const tokens = await prisma.deviceToken.findMany({
        where: { userId }
    })

    if (tokens.length === 0) return

    await Promise.allSettled(
        tokens.map(( { token }) => sendPushNotification(token, payload))
    )
}