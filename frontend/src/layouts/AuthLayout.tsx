import { CheckCircle2 } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import styles from './AuthLayout.module.css'

const features = [
  'Unified customer & vendor management',
  'Job cards, invoices & accounting in one place',
  'Real-time business insights',
]

export function AuthLayout() {
  return (
    <div className={styles.shell}>
      <section className={styles.hero} aria-hidden>
        <div className={styles.heroGlow} />
        <div className={styles.heroTop}>
          <Logo variant="light" size="lg" showWordmark />
        </div>
        <div className={styles.heroContent}>
          <h1>Run your business with confidence.</h1>
          <p>
            A professional workspace for managing customers, vendors, operations,
            and finances — built for clarity and control.
          </p>
          <ul className={styles.features}>
            {features.map((feature) => (
              <li key={feature} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <CheckCircle2 size={14} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className={styles.panel}>
        <Outlet />
      </section>
    </div>
  )
}
