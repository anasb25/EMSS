import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVatReport } from '@/api/reports'
import { ModulePage } from '@/components/common/ModulePage'
import { ReportDocument } from '@/components/reports/ReportDocument'
import { reportDocumentStyles as doc } from '@/components/reports/ReportDocument'
import { ReportPrintButton } from '@/components/reports/ReportPrintButton'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { ROUTES } from '@/config/routes'
import {
  formatVatDate,
  formatVatMoney,
  getVatPeriodRange,
  vatFilterLabel,
  vatLineTypeLabel,
  vatPeriodLabel,
  type VatPeriodFilter,
  type VatReport,
  type VatReportFilter,
  type VatReportLine,
} from '@/types/vat-report'
import styles from './VatPage.module.css'

const PERIOD_FILTERS: { label: string; value: VatPeriodFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

const TYPE_FILTERS: { label: string; value: VatReportFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Sales', value: 'sales' },
  { label: 'Purchases', value: 'purchases' },
  { label: 'Pay Now', value: 'paynow' },
]

function documentLink(line: VatReportLine): string | null {
  if (line.type === 'sales') {
    return ROUTES.invoiceDetail.replace(':invoiceId', line.id)
  }
  if (line.type === 'purchase') {
    return ROUTES.billDetail.replace(':billId', line.id)
  }
  return null
}

function VatLinesTable({
  lines,
  showType = false,
  tableClassName,
  amountClassName,
  descriptionClassName,
  docLinkClassName,
  typeBadgeClassName,
}: {
  lines: VatReportLine[]
  showType?: boolean
  tableClassName: string
  amountClassName: string
  descriptionClassName?: string
  docLinkClassName?: string
  typeBadgeClassName?: string
}) {
  if (!lines.length) {
    return <p className={styles.stateText}>No VAT records in this period.</p>
  }

  return (
    <div className={styles.tableWrap}>
      <table className={tableClassName}>
        <thead>
          <tr>
            <th>Date</th>
            {showType ? <th>Type</th> : null}
            <th>Document</th>
            <th>Party</th>
            <th>Description</th>
            <th className={amountClassName}>Taxable</th>
            <th className={amountClassName}>VAT</th>
            <th className={amountClassName}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const href = documentLink(line)
            return (
              <tr key={`${line.type}-${line.id}`}>
                <td>{formatVatDate(line.date)}</td>
                {showType ? (
                  <td>
                    {typeBadgeClassName ? (
                      <span
                        className={[typeBadgeClassName, styles[`type_${line.type}`]].join(' ')}
                      >
                        {vatLineTypeLabel(line.type)}
                      </span>
                    ) : (
                      <span className={doc.typeBadge}>{vatLineTypeLabel(line.type)}</span>
                    )}
                  </td>
                ) : null}
                <td>
                  {href && docLinkClassName ? (
                    <Link className={docLinkClassName} to={href}>
                      {line.documentNumber}
                    </Link>
                  ) : (
                    line.documentNumber
                  )}
                </td>
                <td>{line.partyName}</td>
                <td className={descriptionClassName}>{line.description}</td>
                <td className={amountClassName}>{formatVatMoney(line.taxableAmount)}</td>
                <td className={amountClassName}>{formatVatMoney(line.vatAmount)}</td>
                <td className={amountClassName}>{formatVatMoney(line.totalAmount)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function VatPrintView({
  report,
  typeFilter,
  lines,
}: {
  report: VatReport
  typeFilter: VatReportFilter
  lines: VatReportLine[]
}) {
  return (
    <ReportDocument
      title="VAT Report"
      subtitle={`For the period ${formatVatDate(report.dateFrom)} to ${formatVatDate(report.dateTo)}`}
      meta={[vatFilterLabel(typeFilter)]}
    >
      <table className={doc.summaryTable}>
        <tbody>
          <tr>
            <td>Output VAT (Sales)</td>
            <td>{formatVatMoney(report.summary.outputVat)}</td>
          </tr>
          <tr>
            <td>Input VAT</td>
            <td>{formatVatMoney(report.summary.inputVat)}</td>
          </tr>
          <tr>
            <td>Net VAT Payable</td>
            <td>{formatVatMoney(report.summary.netVatPayable)}</td>
          </tr>
        </tbody>
      </table>

      <VatLinesTable
        lines={lines}
        showType={typeFilter === 'all'}
        tableClassName={doc.reportTable}
        amountClassName={doc.amountCol}
        descriptionClassName={doc.descriptionCell}
      />
    </ReportDocument>
  )
}

export function VatPage() {
  const [report, setReport] = useState<VatReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodFilter, setPeriodFilter] = useState<VatPeriodFilter>('month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState<VatReportFilter>('all')

  const dateRange = useMemo(
    () => getVatPeriodRange(periodFilter, customDateFrom, customDateTo),
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
      const response = await fetchVatReport({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        filter: typeFilter,
      })
      setReport(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load VAT report.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, typeFilter])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  const netVatClass =
    report && report.summary.netVatPayable < 0
      ? styles.summaryNegative
      : styles.summaryPositive

  const tableLines = report?.lines ?? []

  return (
    <ModulePage
      title="VAT Report"
      description="Output VAT from sales, input VAT from purchases and pay-now expenses."
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
                  onClick={() => setPeriodFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className={styles.periodFilters} role="group" aria-label="VAT type filter">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={[
                    styles.filterButton,
                    typeFilter === filter.value ? styles.filterButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setTypeFilter(filter.value)}
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

          <div className={styles.reportBody}>
            {isLoading ? (
              <p className={styles.stateText}>Loading VAT report...</p>
            ) : !report ? (
              <p className={styles.stateText}>
                Select a custom date range to generate the VAT report.
              </p>
            ) : (
              <>
                <section className={styles.summaryGrid}>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Output VAT (Sales)</span>
                    <strong className={styles.summaryPositive}>
                      {formatVatMoney(report.summary.outputVat)}
                    </strong>
                    <span className={styles.summaryHint}>
                      Taxable {formatVatMoney(report.summary.outputTaxable)}
                    </span>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Input VAT</span>
                    <strong className={styles.summaryNegative}>
                      {formatVatMoney(report.summary.inputVat)}
                    </strong>
                    <span className={styles.summaryHint}>
                      Taxable {formatVatMoney(report.summary.inputTaxable)}
                    </span>
                  </article>
                  <article
                    className={[styles.summaryCard, styles.summaryCardHighlight].join(' ')}
                  >
                    <span className={styles.summaryLabel}>Net VAT Payable</span>
                    <strong className={netVatClass}>
                      {formatVatMoney(report.summary.netVatPayable)}
                    </strong>
                    <span className={styles.summaryHint}>
                      {vatFilterLabel(typeFilter)} · {vatPeriodLabel(periodFilter)}
                    </span>
                  </article>
                </section>

                <VatLinesTable
                  lines={tableLines}
                  showType={typeFilter === 'all'}
                  tableClassName={styles.reportTable}
                  amountClassName={styles.amountCol}
                  descriptionClassName={styles.descriptionCell}
                  docLinkClassName={styles.docLink}
                  typeBadgeClassName={styles.typeBadge}
                />

                <VatPrintView report={report} typeFilter={typeFilter} lines={tableLines} />
              </>
            )}
          </div>
        </section>
      </div>
    </ModulePage>
  )
}
