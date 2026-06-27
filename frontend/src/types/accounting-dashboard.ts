import type { ProfitLossBasis } from '@/types/profit-loss'

export interface AccountingDashboardKpis {
  revenue: number
  expenses: number
  netProfit: number
  grossProfit: number | null
  outputVat: number
  inputVat: number
  netVat: number
  cashIn: number
  cashOut: number
  cashNet: number
  arOutstanding: number
  apOutstanding: number
  arUnpaidCount: number
  apUnpaidCount: number
  invoiceCount: number
  billCount: number
  expenseCount: number
}

export interface AccountingTrendPoint {
  period: string
  label: string
  revenue: number
  expenses: number
}

export interface AccountingCategoryPoint {
  label: string
  amount: number
}

export interface AccountingCashFlowPoint {
  period: string
  label: string
  cashIn: number
  cashOut: number
}

export interface AccountingStatusBreakdown {
  paidCount: number
  unpaidCount: number
  paidAmount: number
  unpaidAmount: number
}

export interface AccountingDashboard {
  dateFrom: string
  dateTo: string
  basis: ProfitLossBasis
  trendGranularity: 'day' | 'week' | 'month'
  kpis: AccountingDashboardKpis
  revenueExpenseTrend: AccountingTrendPoint[]
  expenseByCategory: AccountingCategoryPoint[]
  cashFlowTrend: AccountingCashFlowPoint[]
  receivablesStatus: AccountingStatusBreakdown
  payablesStatus: AccountingStatusBreakdown
}

export interface DashboardChartColors {
  revenue: string
  revenueSoft: string
  expenses: string
  expensesSoft: string
  cashIn: string
  cashOut: string
  outputVat: string
  inputVat: string
  net: string
  paid: string
  unpaid: string
  palette: string[]
  grid: string
  axis: string
}

const FALLBACK_CHART_COLORS: DashboardChartColors = {
  revenue: '#0284c7',
  revenueSoft: 'rgba(2, 132, 199, 0.12)',
  expenses: '#d97706',
  expensesSoft: 'rgba(217, 119, 6, 0.1)',
  cashIn: '#025587',
  cashOut: '#94a3b8',
  outputVat: '#0284c7',
  inputVat: '#7dd3fc',
  net: '#025587',
  paid: '#059669',
  unpaid: '#d97706',
  palette: [
    '#0284c7',
    '#38bdf8',
    '#025587',
    '#7dd3fc',
    '#059669',
    '#c2deef',
    '#64748b',
    '#bae6fd',
  ],
  grid: '#f1f5f9',
  axis: '#94a3b8',
}

function readCssColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()

  return value || fallback
}

/** Reads chart tokens from CSS variables — stays in sync with app theme */
export function getDashboardChartColors(): DashboardChartColors {
  return {
    revenue: readCssColor('--chart-revenue', FALLBACK_CHART_COLORS.revenue),
    revenueSoft: readCssColor('--chart-revenue-soft', FALLBACK_CHART_COLORS.revenueSoft),
    expenses: readCssColor('--chart-expense', FALLBACK_CHART_COLORS.expenses),
    expensesSoft: readCssColor('--chart-expense-soft', FALLBACK_CHART_COLORS.expensesSoft),
    cashIn: readCssColor('--chart-primary', FALLBACK_CHART_COLORS.cashIn),
    cashOut: readCssColor('--chart-muted', FALLBACK_CHART_COLORS.cashOut),
    outputVat: readCssColor('--chart-revenue', FALLBACK_CHART_COLORS.outputVat),
    inputVat: readCssColor('--chart-accent', FALLBACK_CHART_COLORS.inputVat),
    net: readCssColor('--chart-primary', FALLBACK_CHART_COLORS.net),
    paid: readCssColor('--chart-success', FALLBACK_CHART_COLORS.paid),
    unpaid: readCssColor('--chart-warning', FALLBACK_CHART_COLORS.unpaid),
    palette: [
      readCssColor('--chart-series-1', FALLBACK_CHART_COLORS.palette[0]),
      readCssColor('--chart-series-2', FALLBACK_CHART_COLORS.palette[1]),
      readCssColor('--chart-series-3', FALLBACK_CHART_COLORS.palette[2]),
      readCssColor('--chart-series-4', FALLBACK_CHART_COLORS.palette[3]),
      readCssColor('--chart-series-5', FALLBACK_CHART_COLORS.palette[4]),
      readCssColor('--chart-series-6', FALLBACK_CHART_COLORS.palette[5]),
      readCssColor('--chart-series-7', FALLBACK_CHART_COLORS.palette[6]),
      readCssColor('--chart-series-8', FALLBACK_CHART_COLORS.palette[7]),
    ],
    grid: readCssColor('--chart-grid', FALLBACK_CHART_COLORS.grid),
    axis: readCssColor('--chart-axis', FALLBACK_CHART_COLORS.axis),
  }
}

export function formatDashboardMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDashboardMoneyExact(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDashboardCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`
  }
  return String(Math.round(value))
}

export function dashboardBasisLabel(basis: ProfitLossBasis): string {
  return basis === 'cash' ? 'Cash' : 'Accrual'
}

export function dashboardGranularityLabel(
  granularity: AccountingDashboard['trendGranularity'],
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

export function dashboardProfitMargin(revenue: number, netProfit: number): string {
  if (revenue <= 0) {
    return '—'
  }
  return `${((netProfit / revenue) * 100).toFixed(1)}%`
}

export function dashboardExpenseRatio(revenue: number, expenses: number): string {
  if (revenue <= 0) {
    return '—'
  }
  return `${((expenses / revenue) * 100).toFixed(1)}%`
}

export function dashboardPercent(part: number, total: number): string {
  if (total <= 0) {
    return '0%'
  }
  return `${Math.round((part / total) * 100)}%`
}

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-md)',
  background: 'var(--color-surface)',
  fontSize: 12,
} as const

export const LEGEND_STYLE = {
  fontSize: 12,
  paddingTop: 12,
  color: 'var(--color-text-muted)',
} as const
