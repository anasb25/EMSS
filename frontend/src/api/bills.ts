import { apiRequest } from '@/api/http'
import type { PaginatedResponse } from '@/types/pagination'
import type { PeriodDateRange } from '@/types/period-filter'
import type { Bill, BillFormData } from '@/types/bill'

export interface FetchBillsParams extends PeriodDateRange {
  search?: string
  page?: number
  limit?: number
}

function buildQuery(params: FetchBillsParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

function toPayload(data: BillFormData) {
  return {
    vendorId: data.vendorId,
    vendorReference: data.vendorReference.trim() || undefined,
    billDate: data.billDate,
    dueDate: data.dueDate,
    notes: data.notes.trim() || undefined,
    items: data.items.map((item) => ({
      description: item.description.trim(),
      note: item.note.trim() || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      includeVat: item.includeVat,
      vatPercent: item.vatPercent,
    })),
  }
}

export function fetchBills(
  params: FetchBillsParams = {},
): Promise<PaginatedResponse<Bill>> {
  return apiRequest<PaginatedResponse<Bill>>(`/bills${buildQuery(params)}`)
}

export function fetchBill(id: string): Promise<Bill> {
  return apiRequest<Bill>(`/bills/${id}`)
}

export function createBill(data: BillFormData): Promise<Bill> {
  return apiRequest<Bill>('/bills', {
    method: 'POST',
    body: JSON.stringify(toPayload(data)),
  })
}
