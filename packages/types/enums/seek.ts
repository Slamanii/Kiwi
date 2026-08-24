export const SeekType = {
  LOOKING_TO_RENT: 'LOOKING_TO_RENT',
  LOOKING_TO_BUY: 'LOOKING_TO_BUY',
  PROPERTY_FOR_RENT: 'PROPERTY_FOR_RENT',
  PROPERTY_FOR_SALE: 'PROPERTY_FOR_SALE',
  INFO: 'INFO'
} as const
export type SeekType = (typeof SeekType)[keyof typeof SeekType]

export const SeekStatus = {
  OPEN: 'OPEN',
  SELECTING: 'SELECTING',
  CLOSED: 'CLOSED',
  EXPIRED: 'EXPIRED',
  DEPRECATED: 'DEPRECATED'
} as const
export type SeekStatus = (typeof SeekStatus)[keyof typeof SeekStatus]

export const PropertyType = {
  LOFT: 'LOFT',
  MINI_FLAT: 'MINI_FLAT',
  DUPLEX: 'DUPLEX',
  BUNGALOW: 'BUNGALOW',
  BQ: 'BQ',
  STORE: 'STORE',
  OFFICE: 'OFFICE'
} as const
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType]

export const UrgencyLevel = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT'
} as const
export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel]
