export interface BalanceSheetLine {
  key: string
  label: string
  amount: number
  indent: number
  isTotal?: boolean
  isSection?: boolean
}

export interface BalanceSheetColumn {
  title: string
  lines: BalanceSheetLine[]
  total: number
}

export interface BalanceSheetReport {
  asOfDate: string
  assets: BalanceSheetColumn
  liabilitiesAndEquity: BalanceSheetColumn
  balanced: boolean
}

export function formatBalanceSheetDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatBalanceSheetMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function todayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
