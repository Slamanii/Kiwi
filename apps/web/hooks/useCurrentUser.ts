import { UserRole } from '@kiwi/types'
import { useAuth } from '@/context/AuthContext' 
import { useState, useEffect } from 'react'
import api from '@/lib/api/index'


export function useCurrentUser() {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) { setLoading(false); return }
        api.get('/profile/me')
            .then(res => setProfile(res.data))
            .finally(() => setLoading(false))
    }, [user?.id])

    return {
        user,
        profile,
        isAgent: user?.roles?.some(r => ['AGENT', 'DEVELOPER', 'DESIGNER', 'ADMIN'].includes(r)) ?? false,
        loading, 
    }
}