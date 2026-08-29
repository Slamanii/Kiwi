importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
    apiKey: "AIzaSyCUBm0D1FPjgJwSYuUgn-aX9yV0NwmLnH4",
  authDomain: "kiwi-bbab9.firebaseapp.com",
  projectId: "kiwi-bbab9",
  storageBucket: "kiwi-bbab9.firebasestorage.app",
  messagingSenderId: "607622327928",
  appId: "1:607622327928:web:0955a467aa532ae660c78d",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification ?? {}

    self.registration.showNotification(title ?? 'Kasa', {
        body,
        icon: '/icons/icon-192.png',
        data: payload.data,
    })
})

self.addEventListener('fetch', () => {})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const url = event.notification.data?.url ?? '/profile/notifications'
    const targetUrl = new URL(url, self.location.origin).href

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus()
                }
            }
            for (const client of clientList) {
                if ('focus' in client && 'navigate' in client) {
                    return client.focus().then(() => client.navigate(targetUrl))
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl)
        })
    )
})