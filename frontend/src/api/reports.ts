import { apiRequest } from '@/api/http'
import type { AccountingDashboard } from '@/types/accounting-dashboard'
import type { MainDashboard } from '@/types/main-dashboard'
import type { BalanceSheetReport } from '@/types/balance-sheet'
import type { ProfitLossBasis, ProfitLossReport } from '@/types/profit-loss'
import type { PurchasesAnalytics } from '@/types/purchases-analytics'
import type { SalesAnalytics } from '@/types/sales-analytics'
import type { VatReport, VatReportFilter } from '@/types/vat-report'

export interface FetchAccountingDashboardParams {
  dateFrom: string
  dateTo: string
  basis?: ProfitLossBasis
}

export interface FetchProfitLossParams {
  dateFrom: string
  dateTo: string
  basis?: ProfitLossBasis
}

export interface FetchVatReportParams {
  dateFrom: string
  dateTo: string
  filter?: VatReportFilter
}

export interface FetchBalanceSheetParams {
  asOfDate?: string
}

export interface FetchDateRangeParams {
  dateFrom: string
  dateTo: string
}

export function fetchMainDashboard(): Promise<MainDashboard> {
  return apiRequest<MainDashboard>('/reports/main-dashboard')
}

export function fetchAccountingDashboard(
  params: FetchAccountingDashboardParams,
): Promise<AccountingDashboard> {
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  if (params.basis) {
    query.set('basis', params.basis)
  }

  return apiRequest<AccountingDashboard>(
    `/reports/accounting-dashboard?${query.toString()}`,
  )
}

export function fetchProfitLossReport(
  params: FetchProfitLossParams,
): Promise<ProfitLossReport> {
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  if (params.basis) {
    query.set('basis', params.basis)
  }

  return apiRequest<ProfitLossReport>(`/reports/profit-loss?${query.toString()}`)
}

export function fetchVatReport(params: FetchVatReportParams): Promise<VatReport> {
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  if (params.filter) {
    query.set('filter', params.filter)
  }

  return apiRequest<VatReport>(`/reports/vat?${query.toString()}`)
}

export function fetchBalanceSheetReport(
  params: FetchBalanceSheetParams = {},
): Promise<BalanceSheetReport> {
  const query = new URLSearchParams()

  if (params.asOfDate) {
    query.set('asOfDate', params.asOfDate)
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<BalanceSheetReport>(`/reports/balance-sheet${suffix}`)
}

function buildDateRangeQuery(params: FetchDateRangeParams): string {
  return new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  }).toString()
}

export function fetchSalesAnalytics(
  params: FetchDateRangeParams,
): Promise<SalesAnalytics> {
  return apiRequest<SalesAnalytics>(
    `/reports/sales-analytics?${buildDateRangeQuery(params)}`,
  )
}

export function fetchPurchasesAnalytics(
  params: FetchDateRangeParams,
): Promise<PurchasesAnalytics> {
  return apiRequest<PurchasesAnalytics>(
    `/reports/purchases-analytics?${buildDateRangeQuery(params)}`,
  )
}
