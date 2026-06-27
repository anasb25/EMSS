import { DateRangePicker } from '@/components/ui/DateRangePicker'
import {
  PERIOD_FILTERS,
  type PeriodFilter,
} from '@/types/period-filter'
import styles from './PeriodFilters.module.css'

interface PeriodFiltersProps {
  periodFilter: PeriodFilter
  customDateFrom: string
  customDateTo: string
  onPeriodChange: (period: PeriodFilter) => void
  onCustomDateFromChange: (value: string) => void
  onCustomDateToChange: (value: string) => void
}

export function PeriodFilters({
  periodFilter,
  customDateFrom,
  customDateTo,
  onPeriodChange,
  onCustomDateFromChange,
  onCustomDateToChange,
}: PeriodFiltersProps) {
  return (
    <div className={styles.filtersRow}>
      <div className={styles.periodFilters}>
        {PERIOD_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={[
              styles.filterButton,
              periodFilter === filter.value ? styles.filterButtonActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onPeriodChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {periodFilter === 'custom' ? (
        <DateRangePicker
          label=""
          from={customDateFrom}
          to={customDateTo}
          onFromChange={onCustomDateFromChange}
          onToChange={onCustomDateToChange}
        />
      ) : null}
    </div>
  )
}
