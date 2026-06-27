import type { LucideIcon } from 'lucide-react'
import type { RoleName } from '@/types/user'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  roles?: RoleName[]
  children?: NavItem[]
}
