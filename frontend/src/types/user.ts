export const RoleName = {
  USER: 'User',
  ADMIN: 'Admin',
} as const

export type RoleName = (typeof RoleName)[keyof typeof RoleName]

export interface User {
  id: string
  username: string
  role: RoleName
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserFormData {
  username: string
  password: string
  role: RoleName
  isActive: boolean
}

export type UserStatusFilter = 'all' | 'active' | 'inactive'
export type UserRoleFilter = 'all' | RoleName

export function emptyUserForm(): UserFormData {
  return {
    username: '',
    password: '',
    role: RoleName.USER,
    isActive: true,
  }
}

export function userToFormData(user: User): UserFormData {
  return {
    username: user.username,
    password: '',
    role: user.role,
    isActive: user.isActive,
  }
}

export function roleLabel(role: RoleName): string {
  return role === RoleName.ADMIN ? 'Admin' : 'User'
}

export function formatUserDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
