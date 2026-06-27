import { apiRequest } from '@/api/http'
import type { PaginatedResponse } from '@/types/pagination'
import type { PeriodDateRange } from '@/types/period-filter'
import type {
  Payable,
  PayableFormData,
  RecordPaymentFormData,
} from '@/types/payable'

export type PayableStatusFilter = 'all' | 'unpaid' | 'paid'

export interface FetchPayablesParams extends PeriodDateRange {
  search?: string
  status?: PayableStatusFilter
  page?: number
  limit?: number
}

function buildQuery(params: FetchPayablesParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

function toPayablePayload(data: PayableFormData) {
  return {
    vendorId: data.vendorId,
    amount: Number(data.amount),
    dueDate: data.dueDate || undefined,
    notes: data.notes.trim() || undefined,
  }
}

function toRecordPaymentPayload(data: RecordPaymentFormData) {
  return {
    paymentMethodId: Number(data.paymentMethodId),
    bankDetail: data.bankDetail.trim() || undefined,
    chequeNumber: data.chequeNumber.trim() || undefined,
    chequeDate: data.chequeDate || undefined,
    transactionReference: data.transactionReference.trim() || undefined,
    notes: data.notes.trim() || undefined,
  }
}

export function fetchPayables(
  params: FetchPayablesParams = {},
): Promise<PaginatedResponse<Payable>> {
  return apiRequest<PaginatedResponse<Payable>>(`/payables${buildQuery(params)}`)
}

export function fetchPayable(id: number): Promise<Payable> {
  return apiRequest<Payable>(`/payables/${id}`)
}

export function createPayable(data: PayableFormData): Promise<Payable> {
  return apiRequest<Payable>('/payables', {
    method: 'POST',
    body: JSON.stringify(toPayablePayload(data)),
  })
}

export function recordPayment(
  id: number,
  data: RecordPaymentFormData,
): Promise<Payable> {
  return apiRequest<Payable>(`/payables/${id}/record-payment`, {
    method: 'PATCH',
    body: JSON.stringify(toRecordPaymentPayload(data)),
  })
}

export function deletePayable(id: number): Promise<void> {
  return apiRequest<void>(`/payables/${id}`, {
    method: 'DELETE',
  })
}
