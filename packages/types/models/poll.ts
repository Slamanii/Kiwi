export interface CreatePollInput {
  question: string
  options: string[]
  allowMultiple?: boolean
  closesAt?: string
}
