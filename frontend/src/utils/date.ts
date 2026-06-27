const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export { WEEKDAY_LABELS }

export function parseIsoDate(value: string): Date | null {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatInputDate(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return 'Select date'

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function todayIsoDate(): string {
  return toLocalIsoDate(new Date())
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function isDateDisabled(
  date: Date,
  min?: string,
  max?: string,
): boolean {
  const iso = toLocalIsoDate(date)

  if (min && iso < min) return true
  if (max && iso > max) return true

  return false
}

export interface CalendarDay {
  date: Date
  iso: string
  inCurrentMonth: boolean
}

export function buildCalendarMonth(month: Date): CalendarDay[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const startOffset = firstDay.getDay()
  const gridStart = new Date(year, monthIndex, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    )

    return {
      date,
      iso: toLocalIsoDate(date),
      inCurrentMonth: date.getMonth() === monthIndex,
    }
  })
}

export function monthLabel(month: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(month)
}

export function monthLongName(monthIndex: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(
    new Date(2024, monthIndex, 1),
  )
}

export function monthShortName(monthIndex: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
    new Date(2024, monthIndex, 1),
  )
}

export function isMonthDisabled(
  year: number,
  monthIndex: number,
  min?: string,
  max?: string,
): boolean {
  const firstDay = toLocalIsoDate(new Date(year, monthIndex, 1))
  const lastDay = toLocalIsoDate(new Date(year, monthIndex + 1, 0))

  if (min && lastDay < min) return true
  if (max && firstDay > max) return true

  return false
}

export function isYearDisabled(year: number, min?: string, max?: string): boolean {
  const firstDay = `${year}-01-01`
  const lastDay = `${year}-12-31`

  if (min && lastDay < min) return true
  if (max && firstDay > max) return true

  return false
}

export function buildYearRange(startYear: number, count = 12): number[] {
  return Array.from({ length: count }, (_, index) => startYear + index)
}

export function yearRangeStart(year: number, count = 12): number {
  return Math.floor(year / count) * count
}

export function yearRangeLabel(startYear: number, count = 12): string {
  return `${startYear} – ${startYear + count - 1}`
}
