import axios from 'axios'

export const api = axios.create({
    baseURL: process.env.PORT ? `http://localhost:${process.env.PORT}/api` : process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'ngrok-skip-browser-warning': 'true',
    },
})

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken')
        if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config
        const isRefreshCall = original?.url?.includes('auth/refresh')

        if (error.response?.status === 401 && isRefreshCall) {
            localStorage.clear()
            document.cookie = 'accessToken=; path=/; max-age=0'
            document.cookie = 'refreshToken=; path=/; max-age=0'
            window.location.href = '/login'
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            try {
                if (!refreshPromise) {
                    const refreshToken = localStorage.getItem('refreshToken')
                    refreshPromise = api
                        .post('auth/refresh', { refreshToken })
                        .then((res) => res.data)
                        .finally(() => {
                            refreshPromise = null
                        })
                }
                const data = await refreshPromise
                localStorage.setItem('accessToken', data.accessToken)
                localStorage.setItem('refreshToken', data.refreshToken)
                document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 30}`
                document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}`
                original.headers.authorization = `Bearer ${data.accessToken}`
                return api(original)
            } catch {
                localStorage.clear()
                document.cookie = 'accessToken=; path=/; max-age=0'
                document.cookie = 'refreshToken=; path=/; max-age=0'
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }

)

export default api 