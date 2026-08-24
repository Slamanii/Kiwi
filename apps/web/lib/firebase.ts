import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

async function getMessagingIfSupported() {
    if (!(await isSupported())) return null
    return getMessaging(app)
}

export async function requestNotificationPermission(): Promise<string | null> {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) return null

    try {
        const messaging = await getMessagingIfSupported()
        if (!messaging) return null

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return null

        // Registering (and waiting for it to become active) ourselves, then
        // handing the registration to getToken, avoids the SDK's own default
        // lookup timing out after 10s (messaging/failed-service-worker-registration).
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        await navigator.serviceWorker.ready

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swRegistration,
        })

        return token
    } catch (err) {
        console.error('[FCM] failed to get token', err)
        return null
    }
}

export async function onForegroundMessage(callback: (payload: any) => void) {
    const messaging = await getMessagingIfSupported()
    if (!messaging) return () => {}

    return onMessage(messaging, callback)
}