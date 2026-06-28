export const ThreadStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED'
} as const
export type ThreadStatus = (typeof ThreadStatus)[keyof typeof ThreadStatus]
