import axios from 'axios'

const api = axios.create({
    baseURL: process.env.PORT ? `http://localhost:${process.env.PORT}/api` : process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accesstoken')
        if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                const { data } = await axios.post(
                    `${process.env.PORT}/auth/refresh`,
                    { refreshToken }
                )
                localStorage.setItem('accesToken', data.accessToken)
                localStorage.setItem('refreshToken', data.refreshToken)
                original.headers.authorization = `Bearer ${data.accessToken}`
                return api(original)
            } catch {
                localStorage.clear()
                window.location.href = 'login'
            }
            return Promise.reject(error)
        }
    }

)

export default api 