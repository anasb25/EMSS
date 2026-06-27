import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/useAuth'
import { RoleName } from '@/types/user'

export function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== RoleName.ADMIN) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}
