import { AgreementStatus } from '../enums/agreement.js'

export interface Agreement {
  id: string
  threadId: string
  status: AgreementStatus
  agentFee: number
  createdAt: Date
}

export interface AgreementItem {
  id: string
  agreementId: string
  requirement: string
  completed: boolean
}