import { apiRequest } from '@/api/http'

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  role: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export async function loginRequest(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}
