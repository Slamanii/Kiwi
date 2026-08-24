import api from './index'

export const exploreApi = {
    getTrending: () =>
        api.get('/explore/trending'),
}
