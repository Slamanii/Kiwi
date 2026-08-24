import { AgreementStatus, AgreementStage, AgreementItemKind, AgreementSentiment } from '../enums/agreement.js'



export interface Agreement {
  id: string
  threadId: string
  status: AgreementStatus
  agentFee: number
  proposedBy?: string | null
  createdAt: Date
}

export interface AgreementItem {
  id: string
  agreementId: string
  requirement: string
  completed: boolean
  stage: AgreementStage
  order: number
  kind: AgreementItemKind
  sentiment?: AgreementSentiment | null
  unlocksAt?: Date | null
  notifiedAt?: Date | null
  answer?: string | null
  answeredAt?: Date | null
  answeredBy?: string | null
}
