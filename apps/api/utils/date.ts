export function getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1)
    const diff = date.getTime() - start.getTime()
    return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7)
}