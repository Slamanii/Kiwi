export const ReportReason = {
  FRAUD: 'FRAUD',
  MISREPRESENTATION: 'MISREPRESENTATION',
  HARASSMENT: 'HARASSMENT',
  FAKE_PROFILE: 'FAKE_PROFILE',
  OTHER: 'OTHER'
} as const
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason]

export const ReportStatus = {
  OPEN: 'OPEN',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED'
} as const
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]
