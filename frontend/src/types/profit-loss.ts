export type ProfitLossBasis = 'accrual' | 'cash'

export type ProfitLossPeriodFilter =
  | 'today'
  | 'week'
  | 'month'
  | 'year'
  | 'custom'

export interface ProfitLossLine {
  key: string
  label: string
  amount: number
  categoryId?: number
}

export interface ProfitLossSection {
  lines: ProfitLossLine[]
  total: number
}

export interface ProfitLossReport {
  dateFrom: string
  dateTo: string
  basis: ProfitLossBasis
  income: ProfitLossSection
  purchases?: ProfitLossSection
  grossProfit?: number
  operatingExpenses: ProfitLossSection
  netProfit: number
}

export interface ProfitLossDateRange {
  dateFrom: string
  dateTo: string
}

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

export function todayDateInputValue(): string {
  return toDateInputValue(new Date())
}

export function getProfitLossPeriodRange(
  period: ProfitLossPeriodFilter,
  customFrom = '',
  customTo = '',
): ProfitLossDateRange | null {
  const today = new Date()
  const todayStr = toDateInputValue(today)

  switch (period) {
    case 'today':
      return { dateFrom: todayStr, dateTo: todayStr }
    case 'week':
      return {
        dateFrom: toDateInputValue(startOfWeek(today)),
        dateTo: todayStr,
      }
    case 'month':
      return {
        dateFrom: toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
        dateTo: todayStr,
      }
    case 'year':
      return {
        dateFrom: toDateInputValue(new Date(today.getFullYear(), 0, 1)),
        dateTo: todayStr,
      }
    case 'custom':
      if (!customFrom || !customTo) return null
      return { dateFrom: customFrom, dateTo: customTo }
    default:
      return null
  }
}

export function profitLossPeriodLabel(period: ProfitLossPeriodFilter): string {
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
    default:
      return period
  }
}

export function profitLossBasisLabel(basis: ProfitLossBasis): string {
  return basis === 'accrual' ? 'Accrual' : 'Cash'
}

export function formatProfitLossMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatProfitLossDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}
