export const Trending = {
    PROPERTY_TYPE: 'PROPERTY_TYPE',
    LOCATION: 'LOCATION',
    URGENCY: 'URGENCY',
    ROOMS: 'ROOMS',
    INFO: 'INFO',
} as const

export type Trending = (typeof Trending)[keyof typeof Trending]