import { AgreementStatus, AgreementStage } from '../enums/agreement.js'



export interface CreateAgreementInput {
  agentFee: number
  items: {
    requirement: string
    stage: AgreementStage
  }[]
}

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
