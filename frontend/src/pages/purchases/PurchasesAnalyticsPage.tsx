import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchPurchasesAnalytics } from '@/api/reports'
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
  formatPurchasesAnalyticsMoney,
  purchasesAnalyticsGranularityLabel,
  type PurchasesAnalytics,
} from '@/types/purchases-analytics'
import styles from '../analytics/AnalyticsPage.module.css'

export function PurchasesAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PurchasesAnalytics | null>(null)
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
      const response = await fetchPurchasesAnalytics({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      })
      setAnalytics(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load purchases analytics.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const trendData =
    analytics?.trend.map((point) => ({
      label: point.label,
      Bills: point.bills,
      Expenses: point.expenses,
    })) ?? []

  const categoryData =
    analytics?.expensesByCategory.map((item) => ({
      label: item.label,
      amount: item.amount,
    })) ?? []

  return (
    <ModulePage
      title="Purchases Analytics"
      description="Vendor bills, operating expenses, payables, and spend breakdown."
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
          <p className={styles.stateText}>Loading purchases analytics...</p>
        ) : !analytics ? (
          <p className={styles.stateText}>
            Select a date range to view purchases analytics.
          </p>
        ) : (
          <>
            <section className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Vendor bills</span>
                <strong>{formatPurchasesAnalyticsMoney(analytics.kpis.billPurchases)}</strong>
                <span className={styles.summaryHint}>
                  {analytics.kpis.billCount} bill{analytics.kpis.billCount === 1 ? '' : 's'} · ex VAT
                </span>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Operating expenses</span>
                <strong>{formatPurchasesAnalyticsMoney(analytics.kpis.operatingExpenses)}</strong>
                <span className={styles.summaryHint}>
                  {analytics.kpis.expenseCount} expense
                  {analytics.kpis.expenseCount === 1 ? '' : 's'} · ex VAT
                </span>
              </article>
              <article className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total spend</span>
                <strong className={styles.negative}>
                  {formatPurchasesAnalyticsMoney(analytics.kpis.totalSpend)}
                </strong>
                <span className={styles.summaryHint}>Bills + expenses</span>
              </article>
              <article className={[styles.summaryCard, styles.summaryCardHighlight].join(' ')}>
                <span className={styles.summaryLabel}>Payables outstanding</span>
                <strong>{formatPurchasesAnalyticsMoney(analytics.kpis.apOutstanding)}</strong>
                <span className={styles.summaryHint}>
                  {analytics.kpis.apUnpaidCount} unpaid
                </span>
              </article>
            </section>

            <section className={styles.chartsGrid}>
              <article className={styles.chartCard}>
                <h3 className={styles.sectionTitle}>Bills vs expenses</h3>
                <p className={styles.sectionSubtitle}>
                  {purchasesAnalyticsGranularityLabel(analytics.trendGranularity)} ·{' '}
                  {periodLabel(periodFilter)}
                </p>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={formatDashboardCompact} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => formatDashboardMoneyExact(Number(value ?? 0))}
                      />
                      <Legend wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="Bills" fill={colors.expenses} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill={colors.unpaid} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className={styles.tableCard}>
                <h3 className={styles.sectionTitle}>Top vendors</h3>
                <p className={styles.sectionSubtitle}>By bill amount (ex VAT)</p>
                {analytics.topVendors.length ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Bills</th>
                        <th className={styles.amountCol}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topVendors.map((vendor) => (
                        <tr key={vendor.id}>
                          <td>{vendor.name}</td>
                          <td>{vendor.documentCount}</td>
                          <td className={styles.amountCol}>
                            {formatPurchasesAnalyticsMoney(vendor.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.stateText}>No bills in this period.</p>
                )}
              </article>
            </section>

            {categoryData.length ? (
              <article className={styles.chartCard}>
                <h3 className={styles.sectionTitle}>Expenses by category</h3>
                <p className={styles.sectionSubtitle}>Operating expenses in this period</p>
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis type="number" tickFormatter={formatDashboardCompact} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => formatDashboardMoneyExact(Number(value ?? 0))}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={entry.label}
                            fill={colors.palette[index % colors.palette.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            ) : null}
          </>
        )}
      </div>
    </ModulePage>
  )
}
