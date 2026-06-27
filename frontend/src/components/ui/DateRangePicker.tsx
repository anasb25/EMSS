import { ArrowRight } from 'lucide-react'
import { DateInput } from '@/components/ui/DateInput'
import styles from './DateRangePicker.module.css'

interface DateRangePickerProps {
  label?: string
  fromLabel?: string
  toLabel?: string
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  fromName?: string
  toName?: string
}

export function DateRangePicker({
  label = 'Date Range',
  fromLabel = 'From',
  toLabel = 'To',
  from,
  to,
  onFromChange,
  onToChange,
  fromName = 'dateFrom',
  toName = 'dateTo',
}: DateRangePickerProps) {
  return (
    <div className={styles.wrapper}>
      {label ? <span className={styles.groupLabel}>{label}</span> : null}
      <div className={styles.range}>
        <div className={styles.field}>
          <DateInput
            label={fromLabel}
            name={fromName}
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </div>
        <span className={styles.separator} aria-hidden>
          <ArrowRight size={14} />
        </span>
        <div className={styles.field}>
          <DateInput
            label={toLabel}
            name={toName}
            value={to}
            min={from || undefined}
            onChange={(event) => onToChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
