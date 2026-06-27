import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import type { NavItem as NavItemType } from '@/types/navigation'
import styles from './SidebarNavItem.module.css'

interface SidebarNavItemProps {
  item: NavItemType
  isNested?: boolean
}

function isPathActive(currentPath: string, targetPath: string) {
  if (targetPath === '/') return currentPath === '/'
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

export function SidebarNavItem({ item, isNested = false }: SidebarNavItemProps) {
  const location = useLocation()
  const Icon = item.icon
  const hasChildren = Boolean(item.children?.length)
  const isChildActive = item.children?.some((child) =>
    isPathActive(location.pathname, child.path),
  )
  const isActive = isPathActive(location.pathname, item.path) || Boolean(isChildActive)

  if (hasChildren) {
    return (
      <details className={styles.group} open={isActive}>
        <summary className={[styles.link, isActive ? styles.active : ''].join(' ')}>
          <span className={styles.linkContent}>
            <Icon size={18} strokeWidth={2} />
            <span>{item.label}</span>
          </span>
          <ChevronDown size={16} className={styles.chevron} />
        </summary>
        <div className={styles.children}>
          {item.children?.map((child) => (
            <SidebarNavItem key={child.label} item={child} isNested />
          ))}
        </div>
      </details>
    )
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive: routeActive }) =>
        [
          styles.link,
          isNested ? styles.nested : '',
          routeActive ? styles.active : '',
        ]
          .filter(Boolean)
          .join(' ')
      }
      end={!isNested}
    >
      <span className={styles.linkContent}>
        <Icon size={isNested ? 16 : 18} strokeWidth={2} />
        <span>{item.label}</span>
      </span>
    </NavLink>
  )
}
