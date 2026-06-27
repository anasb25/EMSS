import { apiRequest } from '@/api/http'
import type { SalesDaySummary, SalesPeriodSummary } from '@/types/sales'
import type { PeriodDateRange } from '@/types/period-filter'

export function fetchSalesDaySummary(date: string): Promise<SalesDaySummary> {
  return apiRequest<SalesDaySummary>(`/sales/day?date=${encodeURIComponent(date)}`)
}

export function fetchSalesSummary(
  range: PeriodDateRange = {},
): Promise<SalesPeriodSummary> {
  const params = new URLSearchParams()
  if (range.dateFrom) params.set('dateFrom', range.dateFrom)
  if (range.dateTo) params.set('dateTo', range.dateTo)
  const query = params.toString()
  return apiRequest<SalesPeriodSummary>(`/sales/summary${query ? `?${query}` : ''}`)
}
