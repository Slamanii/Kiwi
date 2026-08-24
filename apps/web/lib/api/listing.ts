import api from './index'

type ListingType = 'FIXED' | 'AUCTION'
type ListingStatus = 'ACTIVE' | 'SOLD' | 'SOLD_OUT' | 'CLOSED' | 'REMOVED'
type ListingCategory =
    | 'FURNITURE' | 'ELECTRONICS' | 'COMPUTING' | 'GADGETS' | 'FASHION' | 'BEAUTY'
    | 'HOME_APPLIANCES' | 'TOOLS_EQUIPMENT' | 'VEHICLES' | 'REAL_ESTATE' | 'BOOKS_MEDIA'
    | 'GAMING' | 'SPORTING_GOODS' | 'SERVICES' | 'FOOD_GROCERY' | 'OTHER'
type ListingCondition = 'NEW' | 'FAIRLY_USED' | 'USED'

export const listingApi = {
    // scope is 'ALL', 'JOINED', or a specific communityId (store picked via search/select)
    browse: (params: { scope?: string; category?: ListingCategory; condition?: ListingCondition; location?: string; q?: string; cursor?: string; limit?: number } = {}) =>
        api.get('/listings', { params }),
    getCategories: (scope: string = 'ALL') =>
        api.get('/listings/categories', { params: { scope } }),
    getById: (id: string) =>
        api.get(`/listings/${id}`),
    create: (communityId: string, data: {
        title: string
        description?: string
        price: number
        currency?: string
        images?: string[]
        type?: ListingType
        category?: ListingCategory
        condition?: ListingCondition
        location?: string
        stock?: number
    }) => api.post(`/listings/${communityId}`, data),
    edit: (id: string, data: Partial<{
        title: string
        description: string
        price: number
        currency: string
        images: string[]
        type: ListingType
        category: ListingCategory
        condition: ListingCondition
        location: string
        stock: number
        status: ListingStatus
    }>) => api.patch(`/listings/${id}`, data),
    delist: (id: string) =>
        api.delete(`/listings/${id}`),
    setSoldOut: (id: string) =>
        api.patch(`/listings/${id}/sold-out`),
    favorite: (id: string) =>
        api.post(`/listings/${id}/favorite`),
    unfavorite: (id: string) =>
        api.delete(`/listings/${id}/favorite`),
    getMyFavorites: () =>
        api.get('/listings/favorites/mine'),
}
