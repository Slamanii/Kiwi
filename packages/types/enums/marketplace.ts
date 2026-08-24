export const ListingType = {
    FIXED: 'FIXED',
    AUCTION: 'AUCTION'
} as const
export type ListingType = (typeof ListingType)[keyof typeof ListingType]

export const ListingStatus = {
    ACTIVE: 'ACTIVE',
    SOLD: 'SOLD',
    SOLD_OUT: 'SOLD_OUT',
    CLOSED: 'CLOSED',
    REMOVED: 'REMOVED'
} as const
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus]

export const OrderStatus = {
    PENDING: 'PENDING',
    ADMIN_CONTACTED: 'ADMIN_CONTACTED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DISPUTED: 'DISPUTED'
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const ListingCategory = {
    FURNITURE: 'FURNITURE',
    ELECTRONICS: 'ELECTRONICS',
    COMPUTING: 'COMPUTING',
    GADGETS: 'GADGETS',
    FASHION: 'FASHION',
    BEAUTY: 'BEAUTY',
    HOME_APPLIANCES: 'HOME_APPLIANCES',
    TOOLS_EQUIPMENT: 'TOOLS_EQUIPMENT',
    VEHICLES: 'VEHICLES',
    REAL_ESTATE: 'REAL_ESTATE',
    BOOKS_MEDIA: 'BOOKS_MEDIA',
    GAMING: 'GAMING',
    SPORTING_GOODS: 'SPORTING_GOODS',
    SERVICES: 'SERVICES',
    FOOD_GROCERY: 'FOOD_GROCERY',
    OTHER: 'OTHER'
} as const
export type ListingCategory = (typeof ListingCategory)[keyof typeof ListingCategory]

export const ListingCondition = {
    NEW: 'NEW',
    FAIRLY_USED: 'FAIRLY_USED',
    USED: 'USED'
} as const
export type ListingCondition = (typeof ListingCondition)[keyof typeof ListingCondition]
