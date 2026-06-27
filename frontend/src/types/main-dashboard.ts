export type MainDashboardActivityType = 'job_card' | 'invoice'

export interface MainDashboardActivity {
  id: string
  type: MainDashboardActivityType
  title: string
  subtitle: string
  amount: number | null
  occurredAt: string
}

export interface MainDashboardKpis {
  activeCustomers: number
  openJobCards: number
  jobCardsOpenedToday: number
  monthRevenue: number
  monthInvoiceCount: number
  monthCollections: number
  monthPurchases: number
  monthOperatingExpenses: number
  monthTotalSpend: number
  monthNetProfit: number
  monthNetVat: number
  cashBalance: number
  arOutstanding: number
  arUnpaidCount: number
  apOutstanding: number
  apUnpaidCount: number
}

export interface MainDashboardTrendPoint {
  period: string
  label: string
  sales: number
  purchases: number
}

export interface MainDashboard {
  monthLabel: string
  dateFrom: string
  dateTo: string
  kpis: MainDashboardKpis
  salesPurchasesTrend: MainDashboardTrendPoint[]
  recentActivity: MainDashboardActivity[]
}

export function formatMainDashboardMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatMainDashboardWhen(value: string): string {
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function mainDashboardActivityLabel(type: MainDashboardActivityType): string {
  return type === 'job_card' ? 'Job card' : 'Invoice'
}
