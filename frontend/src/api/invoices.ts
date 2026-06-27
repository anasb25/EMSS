import { apiRequest } from '@/api/http'
import type { Invoice } from '@/types/invoice'
import type { PaginatedResponse } from '@/types/pagination'
import type { PeriodDateRange } from '@/types/period-filter'

export interface FetchInvoicesParams extends PeriodDateRange {
  search?: string
  page?: number
  limit?: number
}

function buildQuery(params: FetchInvoicesParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchInvoices(
  params: FetchInvoicesParams = {},
): Promise<PaginatedResponse<Invoice>> {
  return apiRequest<PaginatedResponse<Invoice>>(`/invoices${buildQuery(params)}`)
}

export function fetchInvoice(id: string): Promise<Invoice> {
  return apiRequest<Invoice>(`/invoices/${id}`)
}

export function createInvoiceFromJobCard(jobCardId: string): Promise<Invoice> {
  return apiRequest<Invoice>(`/invoices/from-job-card/${jobCardId}`, {
    method: 'POST',
  })
}
