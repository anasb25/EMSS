import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Logo } from '@/components/brand/Logo'
import styles from './DashboardLayout.module.css'

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className={styles.shell}>
      <div className={styles.sidebarPanel}>
        <div className={styles.sidebarBrand}>
          <Logo variant="light" size="lg" showWordmark />
        </div>
        <Sidebar />
      </div>

      <div
        className={[styles.overlay, isSidebarOpen ? styles.overlayVisible : ''].join(' ')}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <aside
        className={[styles.mobileSidebar, isSidebarOpen ? styles.mobileSidebarOpen : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.sidebarBrand}>
          <Logo variant="light" size="lg" showWordmark />
        </div>
        <Sidebar />
      </aside>

      <div className={styles.main}>
        <Header onMenuClick={() => setIsSidebarOpen((open) => !open)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
