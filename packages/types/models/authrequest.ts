import type { User } from './user.js'


export interface SignupInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

// response shapes
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface BecomeAnAgentRequest {
  userId: string
  zone: string          
  rate: number           
  policyNote: string   
  idType: string  
  idNumber: string
  idDocumentUrl: string  
  accountNumber: string
  bankCode: string
  accountName: string
  bio?: string
  phone?: string 
  agentReferralCode?: string      
}