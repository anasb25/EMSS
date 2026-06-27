import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export function Card({
  children,
  className = '',
  padding = 'md',
  interactive = false,
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        styles[padding],
        interactive ? styles.interactive : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
