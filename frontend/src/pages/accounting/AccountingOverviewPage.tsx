import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Receipt,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
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
import { fetchAccountingDashboard } from '@/api/reports'
import { ModulePage } from '@/components/common/ModulePage'
import { PeriodFilters } from '@/components/common/PeriodFilters'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import {
  dashboardBasisLabel,
  dashboardExpenseRatio,
  dashboardGranularityLabel,
  dashboardPercent,
  dashboardProfitMargin,
  formatDashboardCompact,
  formatDashboardMoney,
  formatDashboardMoneyExact,
  getDashboardChartColors,
  LEGEND_STYLE,
  TOOLTIP_STYLE,
  type AccountingDashboard,
  type DashboardChartColors,
} from '@/types/accounting-dashboard'
import type { ProfitLossBasis } from '@/types/profit-loss'
import {
  formatPeriodDate,
  getPeriodRange,
  periodLabel,
  type PeriodFilter,
} from '@/types/period-filter'
import styles from './AccountingOverviewPage.module.css'

const BASIS_OPTIONS: { label: string; value: ProfitLossBasis }[] = [
  { label: 'Accrual', value: 'accrual' },
  { label: 'Cash', value: 'cash' },
]

function seriesColor(name: string, colors: DashboardChartColors): string {
  switch (name) {
    case 'Revenue':
    case 'Cash in':
      return colors.revenue
    case 'Expenses':
    case 'Cash out':
      return colors.expenses
    default:
      return colors.palette[0]
  }
}

function TrendTooltip({
  active,
  payload,
  label,
  colors,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
  colors: DashboardChartColors
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className={styles.chartTooltip}>
      {label ? <span className={styles.chartTooltipTitle}>{label}</span> : null}
      {payload.map((entry) => {
        const dotColor = entry.color ?? seriesColor(entry.name, colors)
        return (
          <div key={entry.name} className={styles.chartTooltipRow}>
            <span className={styles.chartTooltipLabel}>
              <span
                className={styles.chartTooltipDot}
                style={{ background: dotColor }}
              />
              {entry.name}
            </span>
            <span className={styles.chartTooltipValue}>
              {formatDashboardMoneyExact(entry.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function StatusBreakdown({
  title,
  status,
}: {
  title: string
  status: AccountingDashboard['receivablesStatus']
}) {
  const total = status.paidAmount + status.unpaidAmount

  return (
    <div className={styles.statusBlock}>
      <div className={styles.statusHeader}>
        <h3>{title}</h3>
        <span className={styles.statusTotal}>{formatDashboardMoney(total)}</span>
      </div>

      <div className={styles.statusBars}>
        <div className={styles.statusRow}>
          <div className={styles.statusRowHeader}>
            <span className={styles.statusRowLabel}>
              <span className={[styles.balanceDot, styles.balanceDotPaid].join(' ')} />
              Collected / Paid
            </span>
            <span className={styles.statusRowValue}>
              {formatDashboardMoney(status.paidAmount)}
            </span>
          </div>
          <div className={styles.statusTrack}>
            <div
              className={[styles.statusFill, styles.statusFillPaid].join(' ')}
              style={{ width: dashboardPercent(status.paidAmount, total) }}
            />
          </div>
          <span className={styles.statusCounts}>
            {status.paidCount} paid · {dashboardPercent(status.paidAmount, total)} of total
          </span>
        </div>

        <div className={styles.statusRow}>
          <div className={styles.statusRowHeader}>
            <span className={styles.statusRowLabel}>
              <span className={[styles.balanceDot, styles.balanceDotUnpaid].join(' ')} />
              Outstanding
            </span>
            <span className={styles.statusRowValue}>
              {formatDashboardMoney(status.unpaidAmount)}
            </span>
          </div>
          <div className={styles.statusTrack}>
            <div
              className={[styles.statusFill, styles.statusFillUnpaid].join(' ')}
              style={{ width: dashboardPercent(status.unpaidAmount, total) }}
            />
          </div>
          <span className={styles.statusCounts}>
            {status.unpaidCount} unpaid · {dashboardPercent(status.unpaidAmount, total)} of total
          </span>
        </div>
      </div>
    </div>
  )
}

export function AccountingOverviewPage() {
  const [dashboard, setDashboard] = useState<AccountingDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [basis, setBasis] = useState<ProfitLossBasis>('accrual')
  const chartColors = useMemo(() => getDashboardChartColors(), [])

  const axisTick = useMemo(
    () => ({ fill: chartColors.axis, fontSize: 11 }),
    [chartColors.axis],
  )

  const gridProps = useMemo(
    () => ({
      stroke: chartColors.grid,
      strokeDasharray: '4 4',
      vertical: false as const,
    }),
    [chartColors.grid],
  )

  const dateRange = useMemo(
    () => getPeriodRange(periodFilter, customDateFrom, customDateTo),
    [periodFilter, customDateFrom, customDateTo],
  )

  const canLoad = Boolean(dateRange.dateFrom && dateRange.dateTo)

  const loadDashboard = useCallback(async () => {
    if (!dateRange.dateFrom || !dateRange.dateTo) {
      setDashboard(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await fetchAccountingDashboard({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        basis,
      })
      setDashboard(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load accounting overview.',
      )
      setDashboard(null)
    } finally {
      setIsLoading(false)
    }
  }, [basis, dateRange.dateFrom, dateRange.dateTo])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const expenseChartData = useMemo(() => {
    if (!dashboard?.expenseByCategory.length) {
      return []
    }

    return [...dashboard.expenseByCategory]
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 8)
      .map((item) => ({
        ...item,
        shortLabel:
          item.label.length > 22 ? `${item.label.slice(0, 20)}…` : item.label,
      }))
  }, [dashboard])

  const trendHasData = dashboard?.revenueExpenseTrend.some(
    (point) => point.revenue > 0 || point.expenses > 0,
  )

  const cashHasData = dashboard?.cashFlowTrend.some(
    (point) => point.cashIn > 0 || point.cashOut > 0,
  )

  const netProfitClass =
    dashboard && dashboard.kpis.netProfit < 0
      ? styles.heroValueNegative
      : styles.heroValuePositive

  return (
    <ModulePage
      title="Accounting Overview"
      description="Analytics and insights across sales, purchases, expenses, cash, receivables, payables, and VAT."
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <PeriodFilters
            periodFilter={periodFilter}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onPeriodChange={setPeriodFilter}
            onCustomDateFromChange={setCustomDateFrom}
            onCustomDateToChange={setCustomDateTo}
          />

          <div className={styles.basisRow}>
            <div className={styles.basisFilters} role="group" aria-label="Report basis">
              {BASIS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={[
                    styles.filterButton,
                    basis === option.value ? styles.filterButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setBasis(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {periodFilter === 'custom' && !canLoad ? (
              <DateRangePicker
                label="Select a date range"
                from={customDateFrom}
                to={customDateTo}
                onFromChange={setCustomDateFrom}
                onToChange={setCustomDateTo}
              />
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <p className={styles.stateText}>Loading analytics…</p>
        ) : !dashboard ? (
          <p className={styles.stateText}>
            {periodFilter === 'custom'
              ? 'Select a custom date range to view analytics.'
              : 'No analytics available for this period.'}
          </p>
        ) : (
          <>
            <section className={styles.insightBar}>
              <div className={styles.insightPeriod}>
                <span className={styles.insightPeriodLabel}>Reporting period</span>
                <span className={styles.insightPeriodValue}>
                  {formatPeriodDate(dashboard.dateFrom)} — {formatPeriodDate(dashboard.dateTo)}
                </span>
              </div>

              <div className={styles.insightDivider} aria-hidden />

              <div className={styles.insightChips}>
                <div className={styles.insightChip}>
                  <span className={styles.insightChipLabel}>Profit margin</span>
                  <span
                    className={[
                      styles.insightChipValue,
                      dashboard.kpis.netProfit >= 0
                        ? styles.insightChipValuePositive
                        : styles.insightChipValueNegative,
                    ].join(' ')}
                  >
                    {dashboardProfitMargin(dashboard.kpis.revenue, dashboard.kpis.netProfit)}
                  </span>
                </div>
                <div className={styles.insightChip}>
                  <span className={styles.insightChipLabel}>Expense ratio</span>
                  <span className={styles.insightChipValue}>
                    {dashboardExpenseRatio(dashboard.kpis.revenue, dashboard.kpis.expenses)}
                  </span>
                </div>
                <div className={styles.insightChip}>
                  <span className={styles.insightChipLabel}>Net VAT payable</span>
                  <span className={styles.insightChipValue}>
                    {formatDashboardMoney(dashboard.kpis.netVat)}
                  </span>
                </div>
                <div className={styles.insightChip}>
                  <span className={styles.insightChipLabel}>Outstanding AR + AP</span>
                  <span className={styles.insightChipValue}>
                    {formatDashboardMoney(
                      dashboard.kpis.arOutstanding + dashboard.kpis.apOutstanding,
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h2 className={styles.sectionTitle}>Performance</h2>
              <div className={styles.heroGrid}>
                <article className={[styles.heroCard, styles.heroCardPrimary].join(' ')}>
                  <div className={styles.heroTop}>
                    <span className={styles.heroLabel}>Revenue</span>
                    <span className={[styles.heroIcon, styles.heroIconAccent].join(' ')}>
                      <TrendingUp size={16} />
                    </span>
                  </div>
                  <p className={[styles.heroValue, styles.heroValueAccent].join(' ')}>
                    {formatDashboardMoney(dashboard.kpis.revenue)}
                  </p>
                  <span className={styles.heroMeta}>
                    {dashboardBasisLabel(dashboard.basis)} basis · {dashboard.kpis.invoiceCount}{' '}
                    invoice{dashboard.kpis.invoiceCount === 1 ? '' : 's'}
                  </span>
                </article>

                <article className={styles.heroCard}>
                  <div className={styles.heroTop}>
                    <span className={styles.heroLabel}>Total expenses</span>
                    <span className={[styles.heroIcon, styles.heroIconWarning].join(' ')}>
                      <Receipt size={16} />
                    </span>
                  </div>
                  <p className={styles.heroValue}>
                    {formatDashboardMoney(dashboard.kpis.expenses)}
                  </p>
                  <span className={styles.heroMeta}>
                    {dashboard.kpis.expenseCount} expense
                    {dashboard.kpis.expenseCount === 1 ? '' : 's'} · {dashboard.kpis.billCount} bill
                    {dashboard.kpis.billCount === 1 ? '' : 's'}
                  </span>
                </article>

                <article className={styles.heroCard}>
                  <div className={styles.heroTop}>
                    <span className={styles.heroLabel}>Net profit</span>
                    <span className={[styles.heroIcon, styles.heroIconBrand].join(' ')}>
                      <Scale size={16} />
                    </span>
                  </div>
                  <p className={[styles.heroValue, netProfitClass].join(' ')}>
                    {formatDashboardMoney(dashboard.kpis.netProfit)}
                  </p>
                  <span className={styles.heroMeta}>
                    {periodLabel(periodFilter)} · excludes VAT
                  </span>
                </article>

                <article className={styles.heroCard}>
                  <div className={styles.heroTop}>
                    <span className={styles.heroLabel}>Cash movement</span>
                    <span className={[styles.heroIcon, styles.heroIconBrand].join(' ')}>
                      <Wallet size={16} />
                    </span>
                  </div>
                  <p
                    className={[
                      styles.heroValue,
                      dashboard.kpis.cashNet >= 0
                        ? styles.heroValuePositive
                        : styles.heroValueNegative,
                    ].join(' ')}
                  >
                    {formatDashboardMoney(dashboard.kpis.cashNet)}
                  </p>
                  <span className={styles.heroMeta}>
                    <ArrowUpRight size={12} />
                    {formatDashboardMoney(dashboard.kpis.cashIn)} in ·{' '}
                    <ArrowDownRight size={12} />
                    {formatDashboardMoney(dashboard.kpis.cashOut)} out
                  </span>
                </article>
              </div>
            </section>

            <section>
              <h2 className={styles.sectionTitle}>Balances</h2>
              <div className={styles.balanceGrid}>
                <article className={styles.balanceCard}>
                  <span className={styles.balanceIcon}>
                    <Banknote size={18} />
                  </span>
                  <div className={styles.balanceContent}>
                    <span className={styles.balanceLabel}>Accounts receivable</span>
                    <span className={styles.balanceValue}>
                      {formatDashboardMoney(dashboard.kpis.arOutstanding)}
                    </span>
                  </div>
                  <div className={styles.balanceDetail}>
                    <span className={styles.balanceStat}>
                      <span className={[styles.balanceDot, styles.balanceDotUnpaid].join(' ')} />
                      {dashboard.kpis.arUnpaidCount} unpaid
                    </span>
                    <span className={styles.balanceStat}>
                      Outstanding to collect
                    </span>
                  </div>
                </article>

                <article className={styles.balanceCard}>
                  <span className={styles.balanceIcon}>
                    <Receipt size={18} />
                  </span>
                  <div className={styles.balanceContent}>
                    <span className={styles.balanceLabel}>Accounts payable</span>
                    <span className={styles.balanceValue}>
                      {formatDashboardMoney(dashboard.kpis.apOutstanding)}
                    </span>
                  </div>
                  <div className={styles.balanceDetail}>
                    <span className={styles.balanceStat}>
                      <span className={[styles.balanceDot, styles.balanceDotUnpaid].join(' ')} />
                      {dashboard.kpis.apUnpaidCount} unpaid
                    </span>
                    <span className={styles.balanceStat}>
                      Outstanding to pay
                    </span>
                  </div>
                </article>

                <article className={styles.balanceCard}>
                  <span className={styles.balanceIcon}>
                    <Scale size={18} />
                  </span>
                  <div className={styles.balanceContent}>
                    <span className={styles.balanceLabel}>VAT position</span>
                    <span className={styles.balanceValue}>
                      {formatDashboardMoney(dashboard.kpis.netVat)}
                    </span>
                  </div>
                  <div className={styles.balanceDetail}>
                    <span className={styles.balanceStat}>
                      Output {formatDashboardMoney(dashboard.kpis.outputVat)}
                    </span>
                    <span className={styles.balanceStat}>
                      Input {formatDashboardMoney(dashboard.kpis.inputVat)}
                    </span>
                  </div>
                </article>
              </div>
            </section>

            <section className={styles.chartsGrid}>
              <article className={styles.chartCard}>
                <header className={styles.chartHeader}>
                  <div className={styles.chartHeaderText}>
                    <h2>Revenue vs expenses</h2>
                    <p>
                      {dashboardGranularityLabel(dashboard.trendGranularity)} trend — shaded areas
                      show income and spending over time
                    </p>
                  </div>
                  <span className={styles.chartBadge}>
                    {dashboardGranularityLabel(dashboard.trendGranularity)}
                  </span>
                </header>
                <div className={styles.chartBody}>
                  {trendHasData ? (
                    <div className={styles.chartPlot}>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={dashboard.revenueExpenseTrend} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                          <defs>
                            <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartColors.revenue} stopOpacity={0.2} />
                              <stop offset="100%" stopColor={chartColors.revenue} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartColors.expenses} stopOpacity={0.16} />
                              <stop offset="100%" stopColor={chartColors.expenses} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...gridProps} />
                          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                          <YAxis
                            tick={axisTick}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatDashboardCompact}
                            width={48}
                          />
                          <Tooltip content={<TrendTooltip colors={chartColors} />} />
                          <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke={chartColors.revenue}
                            fill="url(#revenueArea)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="expenses"
                            name="Expenses"
                            stroke={chartColors.expenses}
                            fill="url(#expenseArea)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className={styles.chartEmpty}>No revenue or expense activity in this period.</p>
                  )}
                </div>
              </article>

              <article className={styles.chartCard}>
                <header className={styles.chartHeader}>
                  <div className={styles.chartHeaderText}>
                    <h2>Expenses by category</h2>
                    <p>Top pay-now expense categories ranked by amount</p>
                  </div>
                  {expenseChartData.length ? (
                    <span className={styles.chartBadge}>
                      {formatDashboardMoney(
                        expenseChartData.reduce((sum, item) => sum + item.amount, 0),
                      )}
                    </span>
                  ) : null}
                </header>
                <div className={styles.chartBody}>
                  {expenseChartData.length ? (
                    <div className={styles.chartPlot}>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={expenseChartData}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid {...gridProps} horizontal={false} />
                          <XAxis
                            type="number"
                            tick={axisTick}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatDashboardCompact}
                          />
                          <YAxis
                            type="category"
                            dataKey="shortLabel"
                            tick={axisTick}
                            axisLine={false}
                            tickLine={false}
                            width={108}
                          />
                          <Tooltip
                            formatter={(value) => formatDashboardMoneyExact(Number(value ?? 0))}
                            labelFormatter={(_, payload) =>
                              payload?.[0]?.payload?.label ?? ''
                            }
                            contentStyle={TOOLTIP_STYLE}
                          />
                          <Bar dataKey="amount" name="Amount" radius={[0, 6, 6, 0]} barSize={16}>
                            {expenseChartData.map((entry, index) => (
                              <Cell
                                key={entry.label}
                                fill={
                                  chartColors.palette[
                                    index % chartColors.palette.length
                                  ]
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className={styles.chartEmpty}>No categorized expenses in this period.</p>
                  )}
                </div>
              </article>

              <article className={styles.chartCard}>
                <header className={styles.chartHeader}>
                  <div className={styles.chartHeaderText}>
                    <h2>Cash flow</h2>
                    <p>Cashbook movements — money in vs money out</p>
                  </div>
                  <span className={styles.chartBadge}>
                    Net {formatDashboardMoney(dashboard.kpis.cashNet)}
                  </span>
                </header>
                <div className={styles.chartBody}>
                  {cashHasData ? (
                    <div className={styles.chartPlot}>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dashboard.cashFlowTrend} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                          <CartesianGrid {...gridProps} />
                          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                          <YAxis
                            tick={axisTick}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatDashboardCompact}
                            width={48}
                          />
                          <Tooltip content={<TrendTooltip colors={chartColors} />} />
                          <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                          <Bar
                            dataKey="cashIn"
                            name="Cash in"
                            fill={chartColors.cashIn}
                            radius={[6, 6, 0, 0]}
                            barSize={18}
                          />
                          <Bar
                            dataKey="cashOut"
                            name="Cash out"
                            fill={chartColors.cashOut}
                            radius={[6, 6, 0, 0]}
                            barSize={18}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className={styles.chartEmpty}>No cash movements in this period.</p>
                  )}
                </div>
              </article>

              <article className={styles.chartCard}>
                <header className={styles.chartHeader}>
                  <div className={styles.chartHeaderText}>
                    <h2>VAT breakdown</h2>
                    <p>Output VAT collected vs input VAT recoverable</p>
                  </div>
                </header>
                <div className={styles.chartBody}>
                  {dashboard.kpis.outputVat > 0 || dashboard.kpis.inputVat > 0 ? (
                    <div className={styles.chartPlot}>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={[
                            { name: 'Output VAT', value: dashboard.kpis.outputVat },
                            { name: 'Input VAT', value: dashboard.kpis.inputVat },
                            { name: 'Net payable', value: dashboard.kpis.netVat },
                          ]}
                          margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid {...gridProps} />
                          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                          <YAxis
                            tick={axisTick}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatDashboardCompact}
                            width={48}
                          />
                          <Tooltip
                            formatter={(value) => formatDashboardMoneyExact(Number(value ?? 0))}
                            contentStyle={TOOLTIP_STYLE}
                          />
                          <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]} barSize={40}>
                            <Cell fill={chartColors.outputVat} />
                            <Cell fill={chartColors.inputVat} />
                            <Cell fill={chartColors.net} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className={styles.chartEmpty}>No VAT activity in this period.</p>
                  )}
                </div>
              </article>

              <article className={[styles.chartCard, styles.chartCardWide].join(' ')}>
                <header className={styles.chartHeader}>
                  <div className={styles.chartHeaderText}>
                    <h2>Receivables & payables</h2>
                    <p>Paid vs outstanding split — current snapshot across AR and AP</p>
                  </div>
                </header>
                <div className={styles.statusPanel}>
                  <StatusBreakdown
                    title="Accounts receivable"
                    status={dashboard.receivablesStatus}
                  />
                  <StatusBreakdown
                    title="Accounts payable"
                    status={dashboard.payablesStatus}
                  />
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </ModulePage>
  )
}
