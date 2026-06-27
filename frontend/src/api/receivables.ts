import { apiRequest } from '@/api/http'
import type { PaginatedResponse } from '@/types/pagination'
import type { PeriodDateRange } from '@/types/period-filter'
import type {
  Receivable,
  ReceivableFormData,
  RecordReceiptFormData,
} from '@/types/receivable'

export type ReceivableStatusFilter = 'all' | 'unpaid' | 'paid'

export interface FetchReceivablesParams extends PeriodDateRange {
  search?: string
  status?: ReceivableStatusFilter
  page?: number
  limit?: number
}

function buildQuery(params: FetchReceivablesParams): string {
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

function toPayload(data: ReceivableFormData) {
  return {
    customerId: data.customerId,
    amount: Number(data.amount),
    dueDate: data.dueDate || undefined,
    paymentMethodId: data.paymentMethodId
      ? Number(data.paymentMethodId)
      : undefined,
    bankDetail: data.bankDetail.trim() || undefined,
    chequeNumber: data.chequeNumber.trim() || undefined,
    chequeDate: data.chequeDate || undefined,
    transactionReference: data.transactionReference.trim() || undefined,
    notes: data.notes.trim() || undefined,
  }
}

function toRecordReceiptPayload(data: RecordReceiptFormData) {
  return {
    paymentMethodId: Number(data.paymentMethodId),
    bankDetail: data.bankDetail.trim() || undefined,
    chequeNumber: data.chequeNumber.trim() || undefined,
    chequeDate: data.chequeDate || undefined,
    transactionReference: data.transactionReference.trim() || undefined,
    notes: data.notes.trim() || undefined,
  }
}

export function fetchReceivables(
  params: FetchReceivablesParams = {},
): Promise<PaginatedResponse<Receivable>> {
  return apiRequest<PaginatedResponse<Receivable>>(`/receivables${buildQuery(params)}`)
}

export function fetchReceivable(id: number): Promise<Receivable> {
  return apiRequest<Receivable>(`/receivables/${id}`)
}

export function createReceivable(data: ReceivableFormData): Promise<Receivable> {
  return apiRequest<Receivable>('/receivables', {
    method: 'POST',
    body: JSON.stringify(toPayload(data)),
  })
}

export function recordReceipt(
  id: number,
  data: RecordReceiptFormData,
): Promise<Receivable> {
  return apiRequest<Receivable>(`/receivables/${id}/record-receipt`, {
    method: 'PATCH',
    body: JSON.stringify(toRecordReceiptPayload(data)),
  })
}

export function deleteReceivable(id: number): Promise<void> {
  return apiRequest<void>(`/receivables/${id}`, {
    method: 'DELETE',
  })
}
