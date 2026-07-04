export type UserRole = 'CLIENT' | 'AGENT' | 'LAWYER' | 'DEVELOPER'

export type User = {
    id: string
    name: string
    email: string
    phone?: string
    roles: UserRole[]
    paystackRecipientCode?: string
    isBanned: boolean
    createdAt: string
    profile?: Profile
}

export type Profile = {
    id: string
    userId: string
    bio?: string
    avatarUrl?: string
    location?: string
    zone?: string
    rate?: number
    inspectionFee?: number
    policyNote?: string
    requests: number
    ongoing: number
    completedDeals: number
    rating: number
    reviewCount: number
    verificationStatus?: string
}

export type SeekType =
    | 'LOOKING_TO_RENT'
    | 'LOOKING_TO_BUY'
    | 'PROPERTY_FOR_RENT'
    | 'PROPERTY_FOR_SALE'
    | 'INFO'

export type PropertyType =
    | 'LOFT'
    | 'MINI_FLAT'
    | 'DUPLEX'
    | 'BUNGALOW'
    | 'BQ'
    | 'STORE'
    | 'OFFICE'

export type SeekStatus =
    | 'OPEN'
    | 'SELECTING'
    | 'CLOSED'
    | 'EXPIRED'
    | 'DEPRECATED'

export type Seek = {
    id: string
    authorId: string
    content: string
    type: SeekType
    propertyType?: PropertyType
    budget?: number
    location?: string
    urgency?: string
    rooms?: number
    isSingle?: boolean
    hasPets?: boolean
    status: SeekStatus
    likeCount: number
    reseekCount: number
    commentCount: number
    isReseek: boolean
    originalSeekId?: string
    expiresAt?: string
    createdAt: string
    author: Pick<User, 'id' | 'name' | 'roles'> & { profile?: Pick<Profile, 'avatarUrl' | 'location' | 'rating' | 'verificationStatus'> }
}

export type BidStatus = 'PENDING' | 'SELECTED' | 'WITHDRAWN' | 'REJECTED'

export type Bid = {
    id: string
    seekId: string
    agentId: string
    amount: number
    note?: string
    status: BidStatus
    createdAt: string
    agent: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'rating' | 'reviewCount'> }
}

export type ThreadStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED'

export type Thread = {
    id: string
    seekId: string
    clientId: string
    agentId: string
    status: ThreadStatus
    createdAt: string
}

export type MessageType = 'TEXT' | 'AUDIO' | 'FILE' | 'VIDEO'

export type Message = {
    id: string
    threadId?: string
    senderId: string
    type: MessageType
    content?: string
    mediaUrl?: string
    mediaSize?: number
    mediaDuration?: number
    fileName?: string
    read: boolean
    createdAt: string
    sender: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl'> }
}

export type NotificationType =
    | 'BID_RECEIVED'
    | 'BID_SELECTED'
    | 'BID_REJECTED'
    | 'BID_WITHDRAWN'
    | 'THREAD_CREATED'
    | 'MESSAGE_RECEIVED'
    | 'AGREEMENT_SIGNED'
    | 'AGREEMENT_COMPLETED'
    | 'RATING_RECEIVED'
    | 'APPLICATION_APPROVED'
    | 'APPLICATION_REJECTED'
    | 'ACCOUNT_BANNED'
    | 'REFERRAL_PAID'

export type Notification = {
    id: string
    userId: string
    type: NotificationType
    title: string
    body: string
    read: boolean
    metadata?: Record<string, any>
    createdAt: string
}

export type CommunityRole = 'ADMIN' | 'MEMBER'
export type CommunityMessagingMode = 'ADMIN_ONLY' | 'ALL_MEMBERS' | 'SELECTED_MEMBERS'

export type Community = {
    id: string
    name: string
    description?: string
    avatarUrl?: string
    memberCount: number
    messagingMode: CommunityMessagingMode
    lastMessage?: string
    lastMessageAt?: string
    createdAt: string
}

export type PaginatedResponse<T> = {
    data: T[]
    nextCursor: string | null
}