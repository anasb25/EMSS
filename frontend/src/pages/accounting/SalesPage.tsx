import { useCallback, useEffect, useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { fetchReceiptVoucher } from '@/api/receipt-vouchers'
import { fetchSalesSummary } from '@/api/sales'
import { ModulePage } from '@/components/common/ModulePage'
import { ReceiptVoucherDetailsModal } from '@/components/receipt-vouchers/ReceiptVoucherDetailsModal'
import { SalesEntryTable } from '@/components/sales/SalesEntryTable'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { useModal } from '@/hooks/useModal'
import {
  formatPeriodDate,
  getPeriodRange,
  PERIOD_FILTERS,
  periodLabel,
  type PeriodFilter,
} from '@/types/period-filter'
import type { ReceiptVoucher } from '@/types/receipt-voucher'
import {
  formatSalesMoney,
  type SalesEntry,
  type SalesPeriodSummary,
} from '@/types/sales'
import styles from './SalesPage.module.css'

const EMPTY_SUMMARY: SalesPeriodSummary = {
  todayTotal: 0,
  todayCount: 0,
  totalSales: 0,
  entryCount: 0,
  entries: [],
}

export function SalesPage() {
  const [summary, setSummary] = useState<SalesPeriodSummary>(EMPTY_SUMMARY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const voucherModal = useModal<ReceiptVoucher>()

  const dateRange = useMemo(
    () => getPeriodRange(periodFilter, customDateFrom, customDateTo),
    [periodFilter, customDateFrom, customDateTo],
  )

  const showDateColumn = Boolean(
    dateRange.dateFrom &&
      dateRange.dateTo &&
      dateRange.dateFrom !== dateRange.dateTo,
  )

  const loadSummary = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchSalesSummary(dateRange)
      setSummary(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load sales.',
      )
      setSummary(EMPTY_SUMMARY)
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  function handlePeriodChange(nextPeriod: PeriodFilter) {
    setPeriodFilter(nextPeriod)
  }

  async function handleViewReceipt(entry: SalesEntry) {
    setError('')
    try {
      const voucher = await fetchReceiptVoucher(entry.receiptVoucherId)
      voucherModal.open(voucher)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load receipt voucher.',
      )
    }
  }

  const periodSummaryLabel =
    periodFilter === 'today'
      ? "Today's Total"
      : `${periodLabel(periodFilter)} Total`

  const headingLabel =
    periodFilter === 'today'
      ? 'Today'
      : periodFilter === 'all'
        ? 'All sales collections'
        : periodLabel(periodFilter)

  return (
    <ModulePage
      title="Sales"
      description="Daily customer collections recorded from receivable receipts, separate from the cashbook."
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.summaryGrid}>
          <article className={[styles.summaryCard, styles.summaryCardHighlight].join(' ')}>
            <span className={styles.summaryLabel}>Today&apos;s Sales</span>
            <strong>{formatSalesMoney(summary.todayTotal)}</strong>
            <span className={styles.summaryHint}>
              {summary.todayCount} receipt{summary.todayCount === 1 ? '' : 's'} today
            </span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>{periodSummaryLabel}</span>
            <strong>{formatSalesMoney(summary.totalSales)}</strong>
            <span className={styles.summaryHint}>
              {summary.entryCount} receipt{summary.entryCount === 1 ? '' : 's'} in
              selected period
            </span>
          </article>
          {dateRange.dateFrom && dateRange.dateTo ? (
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Date Range</span>
              <strong className={styles.summarySmall}>
                {formatPeriodDate(dateRange.dateFrom)}
                {' — '}
                {formatPeriodDate(dateRange.dateTo)}
              </strong>
              <span className={styles.summaryHint}>
                {periodLabel(periodFilter)} filter active
              </span>
            </article>
          ) : (
            <article className={styles.summaryCard}>
              <TrendingUp size={18} className={styles.summaryIcon} />
              <span className={styles.summaryLabel}>Source</span>
              <strong className={styles.summarySmall}>Accounts Receivable</strong>
              <span className={styles.summaryHint}>
                Record receipts from AR to add sales here
              </span>
            </article>
          )}
        </section>

        <section className={styles.panel}>
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
                  onClick={() => handlePeriodChange(filter.value)}
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
                onFromChange={setCustomDateFrom}
                onToChange={setCustomDateTo}
              />
            ) : null}
          </div>

          <div className={styles.dayHeading}>
            <h2>{headingLabel}</h2>
            <span className={styles.daySubheading}>Customer receipt collections</span>
          </div>

          <SalesEntryTable
            entries={summary.entries}
            isLoading={isLoading}
            showDateColumn={showDateColumn}
            onViewReceipt={(entry) => {
              void handleViewReceipt(entry)
            }}
          />
        </section>
      </div>

      <ReceiptVoucherDetailsModal
        voucher={voucherModal.data ?? null}
        isOpen={voucherModal.isOpen}
        onClose={voucherModal.close}
      />
    </ModulePage>
  )
}
