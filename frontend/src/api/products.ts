import { apiRequest } from '@/api/http'
import type { Product, ProductFormData } from '@/types/product'
import type { PaginatedResponse } from '@/types/pagination'

export type ProductStatusFilter = 'all' | 'active' | 'inactive'

export interface FetchProductsParams {
  search?: string
  status?: ProductStatusFilter
  page?: number
  limit?: number
}

function toPayload(data: ProductFormData) {
  return {
    name: data.name.trim(),
    isActive: data.isActive,
  }
}

function buildQuery(params: FetchProductsParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchProducts(
  params: FetchProductsParams = {},
): Promise<PaginatedResponse<Product>> {
  return apiRequest<PaginatedResponse<Product>>(`/products${buildQuery(params)}`)
}

export function createProduct(data: ProductFormData): Promise<Product> {
  return apiRequest<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(toPayload(data)),
  })
}

export function updateProduct(id: string, data: ProductFormData): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toPayload(data)),
  })
}

export function deleteProduct(id: string): Promise<void> {
  return apiRequest<void>(`/products/${id}`, {
    method: 'DELETE',
  })
}
