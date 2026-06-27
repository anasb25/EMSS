import { apiRequest } from '@/api/http'
import type {
  CashDaySummary,
  CashEntry,
  CashEntryFormData,
  CashPeriodSummary,
  OpeningBalanceFormData,
} from '@/types/cash'
import type { PeriodDateRange } from '@/types/period-filter'

export function fetchCashDaySummary(date: string): Promise<CashDaySummary> {
  return apiRequest<CashDaySummary>(`/cash/day?date=${encodeURIComponent(date)}`)
}

export function fetchCashSummary(
  range: PeriodDateRange = {},
): Promise<CashPeriodSummary> {
  const params = new URLSearchParams()
  if (range.dateFrom) params.set('dateFrom', range.dateFrom)
  if (range.dateTo) params.set('dateTo', range.dateTo)
  const query = params.toString()
  return apiRequest<CashPeriodSummary>(`/cash/summary${query ? `?${query}` : ''}`)
}

function toEntryPayload(data: CashEntryFormData) {
  const cashIn = Number(data.cashIn || 0)
  const cashOut = Number(data.cashOut || 0)

  const payload: Record<string, unknown> = {
    entryDate: data.entryDate,
    description: data.description.trim(),
    cashIn: cashIn > 0 ? cashIn : undefined,
    cashOut: cashOut > 0 ? cashOut : undefined,
    salesPersonName: data.salesPersonName.trim() || undefined,
    remarks: data.remarks.trim() || undefined,
  }

  if (data.accountType) {
    payload.accountType = data.accountType
    if (data.accountType === 'account') {
      payload.ledgerAccountId = Number(data.accountId)
    } else if (data.accountType === 'vendor') {
      payload.vendorId = data.accountId
    } else if (data.accountType === 'customer') {
      payload.customerId = data.accountId
    }
  }

  return payload
}

export function createCashEntry(data: CashEntryFormData): Promise<CashEntry> {
  return apiRequest<CashEntry>('/cash/entries', {
    method: 'POST',
    body: JSON.stringify(toEntryPayload(data)),
  })
}

export function updateCashEntry(
  id: number,
  data: CashEntryFormData,
): Promise<CashEntry> {
  return apiRequest<CashEntry>(`/cash/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toEntryPayload(data)),
  })
}

export function deleteCashEntry(id: number): Promise<void> {
  return apiRequest<void>(`/cash/entries/${id}`, {
    method: 'DELETE',
  })
}

export function createOpeningBalance(
  data: OpeningBalanceFormData,
): Promise<CashEntry> {
  return apiRequest<CashEntry>('/cash/opening-balance', {
    method: 'POST',
    body: JSON.stringify({
      entryDate: data.entryDate,
      amount: Number(data.amount),
      notes: data.notes.trim() || undefined,
    }),
  })
}
