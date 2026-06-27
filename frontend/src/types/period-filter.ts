export type PeriodFilter =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'custom'
  | 'all'

export interface PeriodDateRange {
  dateFrom?: string
  dateTo?: string
}

export const PERIOD_FILTERS: { label: string; value: PeriodFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
  { label: 'All', value: 'all' },
]

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day + (day === 0 ? -6 : 1)
  result.setDate(diff)
  return result
}

export function getPeriodRange(
  period: PeriodFilter,
  customFrom = '',
  customTo = '',
): PeriodDateRange {
  const today = new Date()
  const todayStr = toDateInputValue(today)

  switch (period) {
    case 'today':
      return { dateFrom: todayStr, dateTo: todayStr }
    case 'week':
      return { dateFrom: toDateInputValue(startOfWeek(today)), dateTo: todayStr }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { dateFrom: toDateInputValue(start), dateTo: todayStr }
    }
    case 'year': {
      const start = new Date(today.getFullYear(), 0, 1)
      return { dateFrom: toDateInputValue(start), dateTo: todayStr }
    }
    case 'custom':
      return {
        dateFrom: customFrom || undefined,
        dateTo: customTo || undefined,
      }
    case 'all':
    default:
      return {}
  }
}

export function periodLabel(period: PeriodFilter): string {
  switch (period) {
    case 'today':
      return 'Today'
    case 'week':
      return 'This Week'
    case 'month':
      return 'This Month'
    case 'year':
      return 'This Year'
    case 'custom':
      return 'Custom Range'
    case 'all':
      return 'All Time'
    default:
      return period
  }
}

export function formatPeriodDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
