export const TransactionType = {
  ESCROW_DEPOSIT: 'ESCROW_DEPOSIT',
  ESCROW_RELEASE: 'ESCROW_RELEASE',
  VAULT_DEPOSIT: 'VAULT_DEPOSIT',
  VAULT_WITHDRAWAL: 'VAULT_WITHDRAWAL'
} as const
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export const TransactionStatus = {
  PENDING: 'PENDING',
  SUCCESSFUL: 'SUCCESSFUL',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED'
} as const
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]
