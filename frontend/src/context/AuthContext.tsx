import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginRequest, type AuthUser } from '@/api/auth'

const AUTH_STORAGE_KEY = 'emss_auth'

interface StoredAuth {
  accessToken: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredAuth(): StoredAuth | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as StoredAuth
  } catch {
    return null
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [storedAuth, setStoredAuth] = useState<StoredAuth | null>(() =>
    loadStoredAuth(),
  )

  const login = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required.')
    }

    const response = await loginRequest({
      username: username.trim(),
      password,
    })

    const nextAuth: StoredAuth = {
      accessToken: response.accessToken,
      user: response.user,
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth))
    setStoredAuth(nextAuth)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setStoredAuth(null)
  }, [])

  const value = useMemo(
    () => ({
      user: storedAuth?.user ?? null,
      accessToken: storedAuth?.accessToken ?? null,
      isAuthenticated: Boolean(storedAuth?.accessToken),
      login,
      logout,
    }),
    [storedAuth, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
