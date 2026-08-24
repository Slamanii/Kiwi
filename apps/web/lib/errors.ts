export function getErrorMessage(err: unknown, fallback: string): string {
    const apiError = (err as any)?.response?.data?.error
    return typeof apiError === 'string' ? apiError : fallback
}
