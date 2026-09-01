export type UserRole = 'CLIENT' | 'AGENT' | 'DESIGNER' | 'DEVELOPER' | 'ADMIN'

export type User = {
    id: string
    name: string
    email: string
    phone?: string
    roles: UserRole[]
    paystackRecipientCode?: string
    referralCode?: string
    referralCount?: number
    verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
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
    originalSeek?: Seek
    originalSeekId?: string
    isReseek: boolean
    status: SeekStatus
    propertyType?: PropertyType
    isShortlet?: boolean
    budget?: number
    currency?: string
    location?: string
    state?: string
    zone?: string
    urgency: string
    rooms?: number

    // seeker profile
    isSingle?: boolean
    hasPets?: boolean
    hasChildren?: boolean
    isStudent?: boolean
    worksFromHome?: boolean
    needsMortgage?: boolean
    hasLegalRep?: boolean

    // listing tolerances
    allowsSingle?: boolean
    allowsPets?: boolean
    allowsChildren?: boolean

    // property features
    isFurnished?: boolean
    hasParking?: boolean
    hasGenerator?: boolean
    hasWater?: boolean
    hasCofO?: boolean
    hasFlexiblePayment?: boolean

    commentCount: number
    commentsEnabled: boolean
    likeCount: number
    reseekCount: number
    bidCount: number
    createdAt: string
    updatedAt: string
    expiresAt?: string

    author: Pick<User, 'id' | 'name' | 'roles'> & {
        profile?: Pick<Profile, 'avatarUrl' | 'location' | 'rating' | 'verificationStatus'>
    }
}
export type BidStatus = 'PENDING' | 'SELECTED' | 'WITHDRAWN' | 'REJECTED'

export type Bid = {
    id: string
    seekId: string
    agentId: string
    rate: number
    amount: number
    currency?: string
    message?: string
    images?: string[]
    videoUrl?: string
    status: BidStatus
    createdAt: string
    agent: Pick<User, 'id' | 'name'> & {
        profile?: Pick<Profile, 'avatarUrl' | 'rating' | 'reviewCount' | 'verificationStatus'>
    }
}

// A bid I've placed (agent view) — nests the seek it was placed on, not the agent (that's me).
export type MyBid = {
    id: string
    seekId: string
    agentId: string
    rate: number
    amount: number
    currency?: string
    message?: string
    images?: string[]
    videoUrl?: string
    status: BidStatus
    createdAt: string
    seek: Pick<Seek, 'id' | 'content' | 'type' | 'status' | 'location' | 'budget' | 'urgency' | 'bidCount' | 'createdAt'> & {
        author: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl'> }
    }
}

// A bid on one of my seeks (client view), aggregated across all my seeks — nests both.
export type ReceivedBid = Bid & {
    seek: Pick<Seek, 'id' | 'content' | 'type' | 'location' | 'budget'>
}

export type BidDetail = {
    id: string
    seekId: string
    agentId: string
    rate: number
    amount: number
    currency?: string
    message?: string
    status: BidStatus
    createdAt: string
    seek: Seek
    agent: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'rating' | 'completedDeals'> }
}

export type ThreadStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED'

export type Thread = {
    id: string
    seekId: string
    clientId: string
    agentId: string
    status: ThreadStatus
    clientAccepted: boolean
    agentAccepted: boolean
    createdAt: string
}

export type AgreementStatus = 'PENDING' | 'SIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED'
export type AgreementStage = 'BEFORE' | 'DURING' | 'AFTER'
export type AgreementItemKind = 'CONTENT' | 'CHECKPOINT'
export type AgreementSentiment = 'GOOD' | 'BAD'

export type AgreementItem = {
    id: string
    agreementId: string
    requirement: string
    completed: boolean
    completedAt?: string
    stage: AgreementStage
    order: number
    kind: AgreementItemKind
    sentiment?: AgreementSentiment
    unlocksAt?: string
    notifiedAt?: string
    answer?: string
    answeredAt?: string
    answeredBy?: string
}

export type Agreement = {
    id: string
    threadId: string
    status: AgreementStatus
    agentFee: number
    proposedBy?: string
    escrowRef?: string
    documentUrl?: string
    disputeReason?: string
    disputedBy?: string
    clientSignedAt?: string
    agentSignedAt?: string
    clientSignature?: string
    agentSignature?: string
    createdAt: string
    updatedAt: string
    items: AgreementItem[]
}

export type ThreadDetail = {
    id: string
    seekId: string
    clientId: string
    agentId: string
    status: ThreadStatus
    clientAccepted: boolean
    agentAccepted: boolean
    createdAt: string
    seek: Seek
    client: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
    agent: Pick<User, 'id' | 'name'> & {
        profile?: Pick<Profile, 'avatarUrl' | 'rating' | 'completedDeals' | 'rate' | 'policyNote' | 'inspectionFee' | 'verificationStatus'>
    }
    messages: Message[]
    agreement: Agreement | null
}

export type ThreadSummary = {
    id: string
    seekId: string
    clientId: string
    agentId: string
    status: ThreadStatus
    createdAt: string
    updatedAt: string
    seek: Pick<Seek, 'id' | 'content' | 'type' | 'location' | 'budget'>
    client: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
    agent: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'rating' | 'verificationStatus'> }
    agreement: {
        id: string
        status: AgreementStatus
        agentFee: number
        clientSignedAt?: string
        agentSignedAt?: string
        documentUrl?: string
    } | null
    messages: (Pick<Message, 'id' | 'content' | 'type' | 'createdAt' | 'senderId' | 'read'>)[]
    unreadCount: number
}

export type DMConversationSummary = {
    id: string
    otherUser: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
    lastMessage?: string
    lastMessageAt?: string
    unreadCount: number
}

export type MessageType = 'TEXT' | 'AUDIO' | 'FILE' | 'VIDEO' | 'POLL' | 'IMAGE' | 'STICKER'

export type PollOptionData = {
    id: string
    text: string
    order: number
}

export type Poll = {
    id: string
    creatorId: string
    question: string
    allowMultiple: boolean
    closesAt?: string
    options: PollOptionData[]
}

export type PollOptionResult = {
    id: string
    text: string
    voteCount: number
    percentage: number
    votedByMe: boolean
}

export type PollResults = {
    id: string
    question: string
    allowMultiple: boolean
    closesAt?: string
    totalVotes: number
    options: PollOptionResult[]
}

export type MessageReplyPreview = {
    id: string
    type: MessageType
    content?: string
    deleted?: boolean
    sender: Pick<User, 'id' | 'name'>
}

export type Message = {
    id: string
    threadId?: string
    communityId?: string
    conversationId?: string
    orderId?: string
    order?: Order
    listingId?: string
    listing?: Pick<Listing, 'id' | 'title' | 'description' | 'price' | 'currency' | 'images'>
    pollId?: string
    poll?: Poll
    senderId: string
    type: MessageType
    content?: string
    mediaUrl?: string
    mediaSize?: number
    mediaDuration?: number
    fileName?: string
    read: boolean
    deleted?: boolean
    deletedAt?: string
    pinned?: boolean
    pinnedAt?: string
    archived?: boolean
    archivedAt?: string
    replyToId?: string
    replyTo?: MessageReplyPreview
    createdAt: string
    sender: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
}

export type NotificationType =
    | 'NEW_BID'
    | 'BID_SELECTED'
    | 'BID_REJECTED'
    | 'NEW_MESSAGE'
    | 'AGREEMENT_SENT'
    | 'AGREEMENT_ACCEPTED'
    | 'AGREEMENT_SIGNED'
    | 'ESCROW_FUNDED'
    | 'DEAL_COMPLETED'
    | 'DEAL_DISPUTED'
    | 'NEW_RESEEK'
    | 'RATING_RECEIVED'
    | 'APPLICATION_REJECTED'
    | 'APPLICATION_APPROVED'
    | 'VERIFICATION_APPROVED'
    | 'VERIFICATION_REJECTED'
    | 'COMPLIANCE_REQUIRED'
    | 'TERMS_PENDING'
    | 'TERMS_ACCEPTED'
    | 'THREAD_ENDED'
    | 'THREAD_STALLED'
    | 'PA_DUE'
    | 'ACCOUNT_BANNED'
    | 'REFERRAL_PAID'
    | 'NEW_ORDER'
    | 'AGREEMENT_ITEM_DUE'
    | 'COMMUNITY_JOIN_REQUEST'
    | 'COMMUNITY_JOIN_ACCEPTED'
    | 'COMMUNITY_JOIN_DECLINED'
    | 'ORDER_MESSAGE'
    | 'ORDER_COMPLETED'
    | 'SYSTEM'

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
export type CommunityType = 'STANDARD' | 'MARKETPLACE'
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
export type CommunityCategory =
    | 'NEIGHBORHOOD'
    | 'REAL_ESTATE'
    | 'INTERIOR_DESIGN'
    | 'PROPERTY_INVESTMENT'
    | 'AGENTS_PROFESSIONALS'
    | 'STUDENT_HOUSING'
    | 'HOME_SERVICES'
    | 'GENERAL'

export type Community = {
    id: string
    name: string
    description?: string
    avatarUrl?: string
    memberCount: number
    messagingMode: CommunityMessagingMode
    type: CommunityType
    category: CommunityCategory
    requireApproval: boolean
    verificationStatus?: VerificationStatus
    dealsCompleted?: number
    dealsOngoing?: number
    rating?: number
    reviewCount?: number
    listingCount?: number
    lastMessage?: string
    lastMessageAt?: string
    createdAt: string
    currentUserRole?: CommunityRole
    currentUserCanPost?: boolean
    isMember?: boolean
}

export type CommunityMember = {
    id: string
    communityId: string
    userId: string
    role: CommunityRole
    canPost: boolean
    joinedAt: string
    user: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
}

export type CommunityJoinRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export type CommunityJoinRequest = {
    id: string
    communityId: string
    userId: string
    status: CommunityJoinRequestStatus
    createdAt: string
    respondedAt?: string
    user: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
}

export type ListingType = 'FIXED' | 'AUCTION'
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'SOLD_OUT' | 'CLOSED' | 'REMOVED'
export type ListingCategory =
    | 'FURNITURE'
    | 'ELECTRONICS'
    | 'COMPUTING'
    | 'GADGETS'
    | 'FASHION'
    | 'BEAUTY'
    | 'HOME_APPLIANCES'
    | 'TOOLS_EQUIPMENT'
    | 'VEHICLES'
    | 'REAL_ESTATE'
    | 'BOOKS_MEDIA'
    | 'GAMING'
    | 'SPORTING_GOODS'
    | 'SERVICES'
    | 'FOOD_GROCERY'
    | 'OTHER'
export type ListingCondition = 'NEW' | 'FAIRLY_USED' | 'USED'

export type Listing = {
    id: string
    communityId: string
    creatorId: string
    title: string
    description?: string
    price: number
    currency: string
    images: string[]
    type: ListingType
    category: ListingCategory
    condition: ListingCondition
    location?: string
    status: ListingStatus
    stock: number
    soldOutAt?: string
    createdAt: string
    updatedAt: string
    community?: Pick<Community, 'id' | 'name' | 'avatarUrl' | 'verificationStatus'>
    favorited?: boolean
}

export type ListingFavorite = {
    id: string
    userId: string
    listingId: string
    createdAt: string
}

export type FavoritedListing = Listing & {
    favoritedAt: string
    media: MediaItem[]
}

export type OrderStatus = 'PENDING' | 'ADMIN_CONTACTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'

export type OrderItem = {
    id: string
    orderId: string
    listingId: string
    quantity: number
    price: number
    listing?: Pick<Listing, 'id' | 'title' | 'price' | 'images'>
}

export type Order = {
    id: string
    conversationId?: string
    buyerId: string
    communityId: string
    claimedByAdminId?: string
    description?: string
    status: OrderStatus
    createdAt: string
    updatedAt: string
    items: OrderItem[]
    buyer?: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
    review?: Pick<CommunityReview, 'id'> | null
}

export type StoreConversation = {
    id: string
    buyerId: string
    communityId: string
    lastMessage?: string
    lastMessageAt?: string
    createdAt: string
    unreadCount?: number
    buyer?: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl' | 'verificationStatus'> }
    community?: Pick<Community, 'id' | 'name' | 'avatarUrl' | 'type'>
}

export type CommunityReview = {
    id: string
    reviewerId: string
    communityId: string
    orderId: string
    score: number
    comment?: string
    createdAt: string
    reviewer: Pick<User, 'id' | 'name'> & { profile?: Pick<Profile, 'avatarUrl'> }
}

export type PaginatedResponse<T> = {
    data: T[]
    nextCursor: string | null
}

export type Review = {
    id: string
    reviewerId: string
    agentId: string
    threadId: string
    score: number
    comment?: string
    createdAt: string
    reviewer: Pick<User, 'id' | 'name'> & {
        profile?: Pick<Profile, 'avatarUrl'>
    }
}

// Shared shape for anything rendered through MediaViewport (bids, listings, catalog, posts, ...)
export type MediaItem = {
    type: 'image' | 'video'
    url: string
    caption?: string | null
}