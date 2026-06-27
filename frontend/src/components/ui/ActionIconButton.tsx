import type { ReactNode } from 'react'
import styles from './ActionIconButton.module.css'

type ActionVariant = 'view' | 'edit' | 'delete'

interface ActionIconButtonProps {
  variant: ActionVariant
  label: string
  onClick: () => void
  children: ReactNode
}

export function ActionIconButton({
  variant,
  label,
  onClick,
  children,
}: ActionIconButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, styles[variant]].join(' ')}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
