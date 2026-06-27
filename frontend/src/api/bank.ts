import { apiRequest } from '@/api/http'
import type {
  BankDaySummary,
  BankEntry,
  BankEntryFormData,
  BankPeriodSummary,
} from '@/types/bank'
import type { PeriodDateRange } from '@/types/period-filter'

export function fetchBankDaySummary(date: string): Promise<BankDaySummary> {
  return apiRequest<BankDaySummary>(`/bank/day?date=${encodeURIComponent(date)}`)
}

export function fetchBankSummary(
  range: PeriodDateRange = {},
): Promise<BankPeriodSummary> {
  const params = new URLSearchParams()
  if (range.dateFrom) params.set('dateFrom', range.dateFrom)
  if (range.dateTo) params.set('dateTo', range.dateTo)
  const query = params.toString()
  return apiRequest<BankPeriodSummary>(`/bank/summary${query ? `?${query}` : ''}`)
}

function toEntryPayload(data: BankEntryFormData) {
  const bankIn = Number(data.bankIn || 0)
  const bankOut = Number(data.bankOut || 0)

  const payload: Record<string, unknown> = {
    entryDate: data.entryDate,
    description: data.description.trim(),
    bankIn: bankIn > 0 ? bankIn : undefined,
    bankOut: bankOut > 0 ? bankOut : undefined,
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

export function createBankEntry(data: BankEntryFormData): Promise<BankEntry> {
  return apiRequest<BankEntry>('/bank/entries', {
    method: 'POST',
    body: JSON.stringify(toEntryPayload(data)),
  })
}

export function updateBankEntry(
  id: number,
  data: BankEntryFormData,
): Promise<BankEntry> {
  return apiRequest<BankEntry>(`/bank/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toEntryPayload(data)),
  })
}

export function deleteBankEntry(id: number): Promise<void> {
  return apiRequest<void>(`/bank/entries/${id}`, {
    method: 'DELETE',
  })
}
