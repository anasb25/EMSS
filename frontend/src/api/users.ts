import { apiRequest } from '@/api/http'
import type { PaginatedResponse } from '@/types/pagination'
import {
  RoleName,
  type User,
  type UserFormData,
  type UserRoleFilter,
  type UserStatusFilter,
} from '@/types/user'

export interface FetchUsersParams {
  search?: string
  status?: UserStatusFilter
  role?: UserRoleFilter
  page?: number
  limit?: number
}

function toPayload(data: UserFormData, isEditing: boolean) {
  const payload: Record<string, unknown> = {
    username: data.username.trim(),
    role: data.role,
    isActive: data.isActive,
  }

  if (!isEditing || data.password.trim()) {
    payload.password = data.password
  }

  return payload
}

function buildQuery(params: FetchUsersParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.role && params.role !== 'all') query.set('role', params.role)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function fetchUsers(
  params: FetchUsersParams = {},
): Promise<PaginatedResponse<User>> {
  return apiRequest<PaginatedResponse<User>>(`/users${buildQuery(params)}`)
}

export function createUser(data: UserFormData): Promise<User> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(toPayload(data, false)),
  })
}

export function updateUser(id: string, data: UserFormData): Promise<User> {
  return apiRequest<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toPayload(data, true)),
  })
}

export function deleteUser(id: string): Promise<void> {
  return apiRequest<void>(`/users/${id}`, {
    method: 'DELETE',
  })
}

export const USER_ROLE_OPTIONS = [
  { value: RoleName.USER, label: 'User' },
  { value: RoleName.ADMIN, label: 'Admin' },
]
