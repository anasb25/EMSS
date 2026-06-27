import { apiRequest } from '@/api/http'
import type { PaginatedResponse } from '@/types/pagination'
import type { ReceiptVoucher } from '@/types/receipt-voucher'

export interface FetchReceiptVouchersParams {
  search?: string
  page?: number
  limit?: number
}

function buildQuery(params: FetchReceiptVouchersParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchReceiptVouchers(
  params: FetchReceiptVouchersParams = {},
): Promise<PaginatedResponse<ReceiptVoucher>> {
  return apiRequest<PaginatedResponse<ReceiptVoucher>>(
    `/receipt-vouchers${buildQuery(params)}`,
  )
}

export function fetchReceiptVoucher(id: number): Promise<ReceiptVoucher> {
  return apiRequest<ReceiptVoucher>(`/receipt-vouchers/${id}`)
}

export function fetchReceiptVoucherByReceivable(
  receivableId: number,
): Promise<ReceiptVoucher> {
  return apiRequest<ReceiptVoucher>(
    `/receipt-vouchers/by-receivable/${receivableId}`,
  )
}
