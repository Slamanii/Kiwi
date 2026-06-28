export const AgreementStatus = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  ESCROW_FUNDED: 'ESCROW_FUNDED',
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
