import type { NavItem } from '@/types/navigation'
import { RoleName } from '@/types/user'

export function filterNavigationByRole(
  items: NavItem[],
  role: string | undefined,
): NavItem[] {
  return items
    .filter((item) => !item.roles?.length || (role && item.roles.includes(role as RoleName)))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigationByRole(item.children, role)
        : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0)
}
