export interface PurchasesAnalyticsTrendPoint {
  period: string
  label: string
  bills: number
  expenses: number
}

export interface PurchasesAnalytics {
  dateFrom: string
  dateTo: string
  trendGranularity: 'day' | 'week' | 'month'
  kpis: {
    billPurchases: number
    operatingExpenses: number
    totalSpend: number
    billCount: number
    expenseCount: number
    apOutstanding: number
    apUnpaidCount: number
  }
  trend: PurchasesAnalyticsTrendPoint[]
  topVendors: Array<{
    id: string
    name: string
    amount: number
    documentCount: number
  }>
  expensesByCategory: Array<{
    period: string
    label: string
    amount: number
  }>
}

export function formatPurchasesAnalyticsMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function purchasesAnalyticsGranularityLabel(
  granularity: PurchasesAnalytics['trendGranularity'],
): string {
  switch (granularity) {
    case 'day':
      return 'Daily'
    case 'week':
      return 'Weekly'
    case 'month':
      return 'Monthly'
    default:
      return granularity
  }
}
