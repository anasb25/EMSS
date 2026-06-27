import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchSalesAnalytics } from '@/api/reports'
import { ModulePage } from '@/components/common/ModulePage'
import { PeriodFilters } from '@/components/common/PeriodFilters'
import {
  formatDashboardCompact,
  formatDashboardMoneyExact,
  getDashboardChartColors,
  LEGEND_STYLE,
  TOOLTIP_STYLE,
} from '@/types/accounting-dashboard'
import { getPeriodRange, periodLabel, type PeriodFilter } from '@/types/period-filter'
import {
  formatSalesAnalyticsMoney,
  salesAnalyticsGranularityLabel,
  type SalesAnalytics,
} from '@/types/sales-analytics'
import styles from '../analytics/AnalyticsPage.module.css'

export function SalesAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const colors = useMemo(() => getDashboardChartColors(), [])

  const dateRange = useMemo(
    () => getPeriodRange(periodFilter, customDateFrom, customDateTo),
    [periodFilter, customDateFrom, customDateTo],
  )

  const loadAnalytics = useCallback(async () => {
    if (!dateRange.dateFrom || !dateRange.dateTo) {
      setAnalytics(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await fetchSalesAnalytics({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      })
      setAnalytics(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load sales analytics.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const chartData =
    analytics?.trend.map((point) => ({
      label: point.label,
      Invoiced: point.invoiced,
      Collected: point.collected,
    })) ?? []

  return (
    <ModulePage
      title="Sales Analytics"
      description="Invoiced revenue, cash collections, receivables, and top customers."
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <div className={styles.filtersRow}>
            <PeriodFilters
              periodFilter={periodFilter}
              customDateFrom={customDateFrom}
              customDateTo={customDateTo}
              onPeriodChange={setPeriodFilter}
              onCustomDateFromChange={setCustomDateFrom}
              onCustomDateToChange={setCustomDateTo}
            />
          </div>
        </section>

        {isLoading ? (
          <p className={styles.stateText}>Loading sales analytics...</p>
        ) : !analytics ? (
          <p className={styles.stateText}>Select a date range to view sales analytics.</p>
        ) : (
          <>
            <section className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Invoiced revenue</span>
                <strong className={styles.positive}>
                  {formatSalesAnalyticsMoney(analytics.kpis.invoicedRevenue)}
                </strong>
                <span className={styles.summaryHint}>
                  {analytics.kpis.invoiceCount} invoice
                  {analytics.kpis.invoiceCount === 1 ? '' : 's'} · ex VAT
                </span>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Collected</span>
                <strong>{formatSalesAnalyticsMoney(analytics.kpis.collectedRevenue)}</strong>
                <span className={styles.summaryHint}>
                  {analytics.kpis.collectionCount} collection
                  {analytics.kpis.collectionCount === 1 ? '' : 's'}
                </span>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Collection gap</span>
                <strong
                  className={
                    analytics.kpis.collectionGap > 0 ? styles.negative : styles.positive
                  }
                >
                  {formatSalesAnalyticsMoney(analytics.kpis.collectionGap)}
                </strong>
                <span className={styles.summaryHint}>Invoiced minus collected</span>
              </article>
              <article className={[styles.summaryCard, styles.summaryCardHighlight].join(' ')}>
                <span className={styles.summaryLabel}>Receivables outstanding</span>
                <strong>{formatSalesAnalyticsMoney(analytics.kpis.arOutstanding)}</strong>
                <span className={styles.summaryHint}>
                  {analytics.kpis.arUnpaidCount} unpaid
                </span>
              </article>
            </section>

            <section className={styles.chartsGrid}>
              <article className={styles.chartCard}>
                <h3 className={styles.sectionTitle}>Invoiced vs collected</h3>
                <p className={styles.sectionSubtitle}>
                  {salesAnalyticsGranularityLabel(analytics.trendGranularity)} ·{' '}
                  {periodLabel(periodFilter)}
                </p>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={formatDashboardCompact} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => formatDashboardMoneyExact(Number(value ?? 0))}
                      />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="Invoiced" fill={colors.revenue} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Collected" fill={colors.inputVat} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className={styles.tableCard}>
                <h3 className={styles.sectionTitle}>Top customers</h3>
                <p className={styles.sectionSubtitle}>By invoiced amount (ex VAT)</p>
                {analytics.topCustomers.length ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Invoices</th>
                        <th className={styles.amountCol}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.name}</td>
                          <td>{customer.documentCount}</td>
                          <td className={styles.amountCol}>
                            {formatSalesAnalyticsMoney(customer.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.stateText}>No invoices in this period.</p>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </ModulePage>
  )
}
