export interface Bid {
  id: string
  seekId: string
  agentId: string
  rate: number
  amount: number
  currency?: string
  message: string
  images: string[]
  videoUrl?: string
  createdAt: Date
}

export const BidStatus = {
  PENDING: 'PENDING',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus]

export interface CreateBidInput {
    seekId: string,
    rate: number,
    amount: number,
    currency?: string,
    message: string,
    images?: string[],
    videoUrl?: string,
}