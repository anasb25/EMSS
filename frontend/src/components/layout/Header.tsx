import { LogOut, Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import styles from './Header.module.css'

interface HeaderProps {
  onMenuClick?: () => void
}

function formatPageTitle(pathname: string) {
  const segment = pathname.split('/').filter(Boolean).at(-1)
  if (!segment) return 'Dashboard'

  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pageTitle = formatPageTitle(location.pathname)

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>
        <Logo showWordmark size="md" className={styles.logo} />
        <div className={styles.divider} aria-hidden />
        <div className={styles.pageInfo}>
          <p className={styles.eyebrow}>Workspace</p>
          <h2 className={styles.title}>{pageTitle}</h2>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <Search size={15} />
          <span>Search...</span>
        </div>

        <div className={styles.userBlock}>
          <div className={styles.user}>
            <div className={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={styles.userName}>{user?.username}</p>
              <p className={styles.userEmail}>{user?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
            <LogOut size={15} />
          </Button>
        </div>
      </div>
    </header>
  )
}
