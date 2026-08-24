'use client'
import { useEffect } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase.js'
import { authApi } from '../lib/api/auth'
import { useAuth } from '../context/AuthContext'


export async function usePushNotifications() {
    const { user } = useAuth()

    useEffect(() => {

        if (!user) return
        
            requestNotificationPermission().then(token => {
              if (token) authApi.registerDeviceToken(token)
            })
        
        const unsub = onForegroundMessage((payload) => {
                console.log('[FCM foreground', payload)
            })

        return () => { unsub.then(fn => fn()) }
    }, [user?.id])
}