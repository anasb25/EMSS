import { useCallback, useEffect, useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { fetchProfitLossReport } from '@/api/reports'
import { ModulePage } from '@/components/common/ModulePage'
import { ReportDocument } from '@/components/reports/ReportDocument'
import { reportDocumentStyles as doc } from '@/components/reports/ReportDocument'
import { ReportPrintButton } from '@/components/reports/ReportPrintButton'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import {
  formatProfitLossDate,
  formatProfitLossMoney,
  getProfitLossPeriodRange,
  profitLossBasisLabel,
  profitLossPeriodLabel,
  type ProfitLossBasis,
  type ProfitLossPeriodFilter,
  type ProfitLossReport,
} from '@/types/profit-loss'
import styles from './ProfitPage.module.css'

const PERIOD_FILTERS: { label: string; value: ProfitLossPeriodFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

const BASIS_OPTIONS: { label: string; value: ProfitLossBasis }[] = [
  { label: 'Accrual', value: 'accrual' },
  { label: 'Cash', value: 'cash' },
]

function ProfitLossPrintView({
  report,
  totalCosts,
}: {
  report: ProfitLossReport
  totalCosts: number
}) {
  return (
    <ReportDocument
      title="Profit & Loss Statement"
      subtitle={`For the period ${formatProfitLossDate(report.dateFrom)} to ${formatProfitLossDate(report.dateTo)}`}
      meta={[`Basis: ${profitLossBasisLabel(report.basis)}`]}
      currencyNote="Amounts exclude VAT."
    >
      <table className={doc.summaryTable}>
        <tbody>
          <tr>
            <td>Total Income</td>
            <td>{formatProfitLossMoney(report.income.total)}</td>
          </tr>
          <tr>
            <td>{report.basis === 'accrual' ? 'Total Costs' : 'Total Expenses'}</td>
            <td>{formatProfitLossMoney(totalCosts)}</td>
          </tr>
          <tr>
            <td>Net Profit / (Loss)</td>
            <td>{formatProfitLossMoney(report.netProfit)}</td>
          </tr>
        </tbody>
      </table>

      <table className={doc.reportTable}>
        <thead>
          <tr>
            <th>Account</th>
            <th className={doc.amountCol}>Amount (AED)</th>
          </tr>
        </thead>
        <tbody>
          <tr className={doc.sectionRow}>
            <td colSpan={2}>Income</td>
          </tr>
          {report.income.lines.map((line) => (
            <tr key={line.key}>
              <td className={doc.indentCell}>{line.label}</td>
              <td className={doc.amountCol}>{formatProfitLossMoney(line.amount)}</td>
            </tr>
          ))}
          <tr className={doc.totalRow}>
            <td>Total Income</td>
            <td className={doc.amountCol}>{formatProfitLossMoney(report.income.total)}</td>
          </tr>

          {report.basis === 'accrual' && report.purchases ? (
            <>
              <tr className={doc.sectionRow}>
                <td colSpan={2}>Cost of Goods Sold / Purchases</td>
              </tr>
              {report.purchases.lines.map((line) => (
                <tr key={line.key}>
                  <td className={doc.indentCell}>{line.label}</td>
                  <td className={doc.amountCol}>{formatProfitLossMoney(line.amount)}</td>
                </tr>
              ))}
              <tr className={doc.totalRow}>
                <td>Total Purchases</td>
                <td className={doc.amountCol}>{formatProfitLossMoney(report.purchases.total)}</td>
              </tr>
              <tr className={doc.subtotalRow}>
                <td>Gross Profit</td>
                <td className={doc.amountCol}>{formatProfitLossMoney(report.grossProfit ?? 0)}</td>
              </tr>
            </>
          ) : null}

          <tr className={doc.sectionRow}>
            <td colSpan={2}>Operating Expenses</td>
          </tr>
          {report.operatingExpenses.lines.length ? (
            report.operatingExpenses.lines.map((line) => (
              <tr key={line.key}>
                <td className={doc.indentCell}>{line.label}</td>
                <td className={doc.amountCol}>{formatProfitLossMoney(line.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className={doc.indentCell}>No expenses in this period</td>
              <td className={doc.amountCol}>{formatProfitLossMoney(0)}</td>
            </tr>
          )}
          <tr className={doc.totalRow}>
            <td>Total Operating Expenses</td>
            <td className={doc.amountCol}>
              {formatProfitLossMoney(report.operatingExpenses.total)}
            </td>
          </tr>
          <tr className={doc.grandTotalRow}>
            <td>Net Profit / (Loss)</td>
            <td className={doc.amountCol}>{formatProfitLossMoney(report.netProfit)}</td>
          </tr>
        </tbody>
      </table>
    </ReportDocument>
  )
}

export function ProfitPage() {
  const [report, setReport] = useState<ProfitLossReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodFilter, setPeriodFilter] = useState<ProfitLossPeriodFilter>('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [basis, setBasis] = useState<ProfitLossBasis>('accrual')

  const dateRange = useMemo(
    () => getProfitLossPeriodRange(periodFilter, customDateFrom, customDateTo),
    [periodFilter, customDateFrom, customDateTo],
  )

  const loadReport = useCallback(async () => {
    if (!dateRange) {
      setReport(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await fetchProfitLossReport({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        basis,
      })
      setReport(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load profit and loss report.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [basis, dateRange])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  function handlePeriodChange(nextPeriod: ProfitLossPeriodFilter) {
    setPeriodFilter(nextPeriod)
  }

  const totalCosts =
    report?.basis === 'accrual'
      ? (report.purchases?.total ?? 0) + report.operatingExpenses.total
      : report?.operatingExpenses.total ?? 0

  const netProfitClass =
    report && report.netProfit < 0 ? styles.summaryNegative : styles.summaryPositive

  return (
    <ModulePage
      title="Profit & Loss"
      description="Income, purchases, and expenses summarized for the selected period. Amounts exclude VAT."
      actions={report && !isLoading ? <ReportPrintButton /> : undefined}
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

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

          <div className={styles.reportBody}>
            {isLoading ? (
              <p className={styles.stateText}>Loading report...</p>
            ) : !report ? (
              <p className={styles.stateText}>
                Select a custom date range to generate the report.
              </p>
            ) : (
              <>
                <section className={styles.summaryGrid}>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Total Income</span>
                    <strong className={styles.summaryPositive}>
                      {formatProfitLossMoney(report.income.total)}
                    </strong>
                    <span className={styles.summaryHint}>
                      {profitLossBasisLabel(report.basis)} basis
                    </span>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>
                      {report.basis === 'accrual' ? 'Total Costs' : 'Total Expenses'}
                    </span>
                    <strong className={styles.summaryNegative}>
                      {formatProfitLossMoney(totalCosts)}
                    </strong>
                    <span className={styles.summaryHint}>
                      {profitLossPeriodLabel(periodFilter)} period
                    </span>
                  </article>
                  <article
                    className={[styles.summaryCard, styles.summaryCardHighlight].join(' ')}
                  >
                    <span className={styles.summaryLabel}>Net Profit</span>
                    <strong className={netProfitClass}>
                      {formatProfitLossMoney(report.netProfit)}
                    </strong>
                    <span className={styles.summaryHint}>
                      {formatProfitLossDate(report.dateFrom)}
                      {' — '}
                      {formatProfitLossDate(report.dateTo)}
                    </span>
                  </article>
                </section>

                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th className={styles.amountCol}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={styles.sectionRow}>
                      <td colSpan={2}>
                        <TrendingUp size={14} />
                        Income
                      </td>
                    </tr>
                    {report.income.lines.map((line) => (
                      <tr key={line.key}>
                        <td className={styles.indentCell}>{line.label}</td>
                        <td className={styles.amountCol}>
                          {formatProfitLossMoney(line.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className={styles.totalRow}>
                      <td>Total Income</td>
                      <td className={styles.amountCol}>
                        {formatProfitLossMoney(report.income.total)}
                      </td>
                    </tr>

                    {report.basis === 'accrual' && report.purchases ? (
                      <>
                        <tr className={styles.sectionRow}>
                          <td colSpan={2}>
                            <TrendingDown size={14} />
                            Cost of Goods Sold / Purchases
                          </td>
                        </tr>
                        {report.purchases.lines.map((line) => (
                          <tr key={line.key}>
                            <td className={styles.indentCell}>{line.label}</td>
                            <td className={styles.amountCol}>
                              {formatProfitLossMoney(line.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className={styles.totalRow}>
                          <td>Total Purchases</td>
                          <td className={styles.amountCol}>
                            {formatProfitLossMoney(report.purchases.total)}
                          </td>
                        </tr>
                        <tr className={styles.subtotalRow}>
                          <td>Gross Profit</td>
                          <td className={styles.amountCol}>
                            {formatProfitLossMoney(report.grossProfit ?? 0)}
                          </td>
                        </tr>
                      </>
                    ) : null}

                    <tr className={styles.sectionRow}>
                      <td colSpan={2}>
                        <TrendingDown size={14} />
                        Operating Expenses
                      </td>
                    </tr>
                    {report.operatingExpenses.lines.length ? (
                      report.operatingExpenses.lines.map((line) => (
                        <tr key={line.key}>
                          <td className={styles.indentCell}>{line.label}</td>
                          <td className={styles.amountCol}>
                            {formatProfitLossMoney(line.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className={styles.indentCell}>No expenses in this period</td>
                        <td className={styles.amountCol}>{formatProfitLossMoney(0)}</td>
                      </tr>
                    )}
                    <tr className={styles.totalRow}>
                      <td>Total Operating Expenses</td>
                      <td className={styles.amountCol}>
                        {formatProfitLossMoney(report.operatingExpenses.total)}
                      </td>
                    </tr>
                    <tr className={styles.netProfitRow}>
                      <td>Net Profit / (Loss)</td>
                      <td className={styles.amountCol}>
                        {formatProfitLossMoney(report.netProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <ProfitLossPrintView report={report} totalCosts={totalCosts} />
              </>
            )}
          </div>
        </section>
      </div>
    </ModulePage>
  )
}
