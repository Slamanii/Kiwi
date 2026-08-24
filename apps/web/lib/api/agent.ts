import api from './index'

export const agentApi = {
    getAll: (params?: Record<string, any>) =>
        api.get('/agents', { params }),
}
