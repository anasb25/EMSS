const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const AUTH_STORAGE_KEY = 'emss_auth'

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAccessToken(): string | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored) as { accessToken?: string }
    return parsed.accessToken ?? null
  } catch {
    return null
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(data.message)) return data.message.join(', ')
    return data.message ?? 'Request failed'
  } catch {
    return 'Request failed'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new ApiError(await parseError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
