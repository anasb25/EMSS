import { apiRequest } from '@/api/http'
import type { Customer, CustomerFormData } from '@/types/customer'
import type {
  CustomerLedger,
  CustomerLedgerListItem,
  CustomerLedgerListStatusFilter,
  CustomerLedgerStatusFilter,
  CustomerLedgerTypeFilter,
} from '@/types/customer-ledger'
import type { PaginatedResponse } from '@/types/pagination'
import type { PeriodDateRange } from '@/types/period-filter'

export type CustomerStatusFilter = 'all' | 'active' | 'inactive'

export interface FetchCustomersParams {
  search?: string
  status?: CustomerStatusFilter
  page?: number
  limit?: number
}

function toPayload(data: CustomerFormData) {
  return {
    name: data.name.trim(),
    email: data.email.trim() || undefined,
    phoneNumber: data.phoneNumber.trim() || undefined,
    mobileNumber: data.mobileNumber.trim() || undefined,
    country: data.country.trim() || undefined,
    trnNumber: data.trnNumber.trim() || undefined,
    address: data.address.trim() || undefined,
    isActive: data.isActive,
  }
}

function buildQuery(params: FetchCustomersParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchCustomers(
  params: FetchCustomersParams = {},
): Promise<PaginatedResponse<Customer>> {
  return apiRequest<PaginatedResponse<Customer>>(`/customers${buildQuery(params)}`)
}

export function fetchCustomer(id: string): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`)
}

export interface FetchCustomerLedgerParams extends PeriodDateRange {
  search?: string
  status?: CustomerLedgerStatusFilter
  type?: CustomerLedgerTypeFilter
}

export interface FetchCustomerLedgerSummaryParams {
  search?: string
  status?: CustomerLedgerListStatusFilter
  page?: number
  limit?: number
}

function buildLedgerQuery(params: FetchCustomerLedgerParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.type && params.type !== 'all') query.set('type', params.type)
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

function buildLedgerSummaryQuery(params: FetchCustomerLedgerSummaryParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchCustomerLedger(
  customerId: string,
  params: FetchCustomerLedgerParams = {},
): Promise<CustomerLedger> {
  return apiRequest<CustomerLedger>(
    `/customers/${customerId}/ledger${buildLedgerQuery(params)}`,
  )
}

export function fetchCustomerLedgerSummary(
  params: FetchCustomerLedgerSummaryParams = {},
): Promise<PaginatedResponse<CustomerLedgerListItem>> {
  return apiRequest<PaginatedResponse<CustomerLedgerListItem>>(
    `/customers/ledger-summary${buildLedgerSummaryQuery(params)}`,
  )
}

export function createCustomer(data: CustomerFormData): Promise<Customer> {
  return apiRequest<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(toPayload(data)),
  })
}

export function updateCustomer(
  id: string,
  data: CustomerFormData,
): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toPayload(data)),
  })
}

export function deleteCustomer(id: string): Promise<void> {
  return apiRequest<void>(`/customers/${id}`, {
    method: 'DELETE',
  })
}
