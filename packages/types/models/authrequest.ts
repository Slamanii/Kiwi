import type { User } from './user.js'


export interface SignupInput {
  name: string
  email: string
  password: string
  referralCode?: string
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