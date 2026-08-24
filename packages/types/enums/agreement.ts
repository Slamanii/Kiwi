export const AgreementStatus = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DISPUTED: 'DISPUTED'
} as const
export type AgreementStatus = (typeof AgreementStatus)[keyof typeof AgreementStatus]

export const AgreementStage = {
  BEFORE: 'BEFORE',
  DURING: 'DURING',
  AFTER: 'AFTER'
} as const
export type AgreementStage = (typeof AgreementStage)[keyof typeof AgreementStage]

export const AgreementItemKind = {
  CONTENT: 'CONTENT',
  CHECKPOINT: 'CHECKPOINT'
} as const
export type AgreementItemKind = (typeof AgreementItemKind)[keyof typeof AgreementItemKind]

export const AgreementSentiment = {
  GOOD: 'GOOD',
  BAD: 'BAD'
} as const
export type AgreementSentiment = (typeof AgreementSentiment)[keyof typeof AgreementSentiment]

export const PAMilestone = {
  FIRST_CONTACT: 'FIRST_CONTACT',
  INSPECTION_SCHEDULED: 'INSPECTION_SCHEDULED',
  INSPECTION_DONE: 'INSPECTION_DONE',
  NEGOTIATING: 'NEGOTIATING',
  DOCUMENTS_SUBMITTED: 'DOCUMENTS_SUBMITTED',
  AGREEMENT_SIGNED: 'AGREEMENT_SIGNED',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
} as const 
export type PAMilestone = (typeof PAMilestone)[keyof typeof PAMilestone]


export const PAHealthTag = {
  COMMUNICATING_WELL: 'COMMUNICATING_WELL',
  SLOW_RESPONSE: 'SLOW_RESPONSE',
  NOT_GOING_ANYWHERE: 'NOT_GOING_ANYWHERE',
  WAITING_ON_LANDLORD: 'WAITING_ON_LANDLORD',
  PRICE_DISPUTE: 'PRICE_DISPUTE',
} as const 
export type PAHealthTag = (typeof PAHealthTag)[keyof typeof PAHealthTag]


export const PAMood = {
  GOOD: 'GOOD',
  OKAY: 'OKAY',
  BAD: 'BAD',
} as const
export type PAMood = (typeof PAMood)[keyof typeof PAMood]

