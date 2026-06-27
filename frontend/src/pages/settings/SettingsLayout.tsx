import { NavLink, Outlet } from 'react-router-dom'
import { UserCog } from 'lucide-react'
import { ModulePage } from '@/components/common/ModulePage'
import { ROUTES } from '@/config/routes'
import styles from './SettingsLayout.module.css'

const SETTINGS_TABS = [
  {
    label: 'User Management',
    path: ROUTES.settings.users,
    icon: UserCog,
  },
]

export function SettingsLayout() {
  return (
    <ModulePage
      title="Settings"
      description="Manage system users, roles, and access control."
    >
      <div className={styles.layout}>
        <nav className={styles.tabs} aria-label="Settings sections">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')
                }
              >
                <Icon size={16} />
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </ModulePage>
  )
}
