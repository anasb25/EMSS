import { Check, X } from 'lucide-react'
import styles from './StatusIndicator.module.css'

interface StatusIndicatorProps {
  value: boolean
  trueLabel?: string
  falseLabel?: string
}

export function StatusIndicator({
  value,
  trueLabel = 'Complete',
  falseLabel = 'Pending',
}: StatusIndicatorProps) {
  return (
    <span
      className={[styles.indicator, value ? styles.complete : styles.pending].join(' ')}
      title={value ? trueLabel : falseLabel}
      aria-label={value ? trueLabel : falseLabel}
    >
      {value ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
    </span>
  )
}
