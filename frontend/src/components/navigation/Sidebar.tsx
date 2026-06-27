import { mainNavigation } from '@/config/navigation'
import { SidebarNavItem } from '@/components/navigation/SidebarNavItem'
import { useAuth } from '@/hooks/useAuth'
import { filterNavigationByRole } from '@/utils/navigation'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const { user } = useAuth()
  const navigation = filterNavigationByRole(mainNavigation, user?.role)

  return (
    <aside className={styles.sidebar}>
      <p className={styles.sectionLabel}>Main Menu</p>
      <nav className={styles.nav} aria-label="Main navigation">
        {navigation.map((item) => (
          <SidebarNavItem key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  )
}
