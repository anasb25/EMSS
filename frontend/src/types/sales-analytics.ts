export interface AnalyticsPartyPoint {
  id: string
  name: string
  amount: number
  documentCount: number
}

export interface SalesAnalyticsTrendPoint {
  period: string
  label: string
  invoiced: number
  collected: number
}

export interface SalesAnalytics {
  dateFrom: string
  dateTo: string
  trendGranularity: 'day' | 'week' | 'month'
  kpis: {
    invoicedRevenue: number
    collectedRevenue: number
    collectionGap: number
    invoiceCount: number
    collectionCount: number
    arOutstanding: number
    arUnpaidCount: number
  }
  trend: SalesAnalyticsTrendPoint[]
  topCustomers: AnalyticsPartyPoint[]
}

export function formatSalesAnalyticsMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function salesAnalyticsGranularityLabel(
  granularity: SalesAnalytics['trendGranularity'],
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
