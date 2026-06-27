import { apiRequest } from '@/api/http'
import type { PaginatedResponse } from '@/types/pagination'
import type { Vendor, VendorFormData } from '@/types/vendor'

export type VendorStatusFilter = 'all' | 'active' | 'inactive'

export interface FetchVendorsParams {
  search?: string
  status?: VendorStatusFilter
  page?: number
  limit?: number
}

function toPayload(data: VendorFormData) {
  return {
    name: data.name.trim(),
    email: data.email.trim() || undefined,
    phoneNumber: data.phoneNumber.trim() || undefined,
    mobileNumber: data.mobileNumber.trim() || undefined,
    country: data.country.trim() || undefined,
    address: data.address.trim() || undefined,
    isActive: data.isActive,
  }
}

function buildQuery(params: FetchVendorsParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchVendors(
  params: FetchVendorsParams = {},
): Promise<PaginatedResponse<Vendor>> {
  return apiRequest<PaginatedResponse<Vendor>>(`/vendors${buildQuery(params)}`)
}

export function createVendor(data: VendorFormData): Promise<Vendor> {
  return apiRequest<Vendor>('/vendors', {
    method: 'POST',
    body: JSON.stringify(toPayload(data)),
  })
}

export function updateVendor(id: string, data: VendorFormData): Promise<Vendor> {
  return apiRequest<Vendor>(`/vendors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toPayload(data)),
  })
}

export function deleteVendor(id: string): Promise<void> {
  return apiRequest<void>(`/vendors/${id}`, {
    method: 'DELETE',
  })
}
