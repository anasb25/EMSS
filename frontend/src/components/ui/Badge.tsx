import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type BadgeVariant = 'success' | 'danger' | 'neutral'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[variant]].join(' ')}>{children}</span>
  )
}
