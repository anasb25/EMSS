import { apiRequest } from '@/api/http'
import type { JobCard, JobCardEditFormData, JobCardFormData } from '@/types/job-card'
import type { PaginatedResponse } from '@/types/pagination'

export type JobCardStatusFilter = 'open' | 'closed' | 'all'

export interface FetchJobCardsParams {
  search?: string
  status?: JobCardStatusFilter
  page?: number
  limit?: number
}

function toCreatePayload(data: JobCardFormData) {
  return {
    customerId: data.customerId,
    blNumber: data.blNumber.trim() || undefined,
    declarationNumber: data.declarationNumber.trim() || undefined,
    containerNumber: data.containerNumber.trim() || undefined,
    description: data.description.trim() || undefined,
    items: data.items.map((item) => ({
      productId: item.productId,
      note: item.note.trim() || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      includeVat: item.includeVat,
    })),
  }
}

function toUpdatePayload(data: JobCardEditFormData) {
  return {
    ...toCreatePayload(data),
    isOpen: data.isOpen,
    transport: data.transport,
    logistics: data.logistics,
    isImport: data.isImport,
    isExport: data.isExport,
    freight: data.freight,
  }
}

function buildQuery(params: FetchJobCardsParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchJobCards(
  params: FetchJobCardsParams = {},
): Promise<PaginatedResponse<JobCard>> {
  return apiRequest<PaginatedResponse<JobCard>>(`/job-cards${buildQuery(params)}`)
}

export function createJobCard(data: JobCardFormData): Promise<JobCard> {
  return apiRequest<JobCard>('/job-cards', {
    method: 'POST',
    body: JSON.stringify(toCreatePayload(data)),
  })
}

export function updateJobCard(id: string, data: JobCardEditFormData): Promise<JobCard> {
  return apiRequest<JobCard>(`/job-cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toUpdatePayload(data)),
  })
}

export function deleteJobCard(id: string): Promise<void> {
  return apiRequest<void>(`/job-cards/${id}`, {
    method: 'DELETE',
  })
}
