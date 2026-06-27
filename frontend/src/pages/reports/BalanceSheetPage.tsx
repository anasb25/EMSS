import { useCallback, useEffect, useState } from 'react'
import { fetchBalanceSheetReport } from '@/api/reports'
import { ModulePage } from '@/components/common/ModulePage'
import { ReportDocument } from '@/components/reports/ReportDocument'
import { reportDocumentStyles as doc } from '@/components/reports/ReportDocument'
import { ReportPrintButton } from '@/components/reports/ReportPrintButton'
import {
  formatBalanceSheetDate,
  formatBalanceSheetMoney,
  todayIsoDate,
  type BalanceSheetColumn,
  type BalanceSheetLine,
  type BalanceSheetReport,
} from '@/types/balance-sheet'
import styles from './BalanceSheetPage.module.css'

function BalanceSheetColumnTable({
  column,
  tableClassName,
  columnTitleClassName,
  amountClassName,
  sectionRowClassName,
  totalRowClassName,
  grandTotalRowClassName,
  indentClassName,
}: {
  column: BalanceSheetColumn
  tableClassName: string
  columnTitleClassName: string
  amountClassName: string
  sectionRowClassName: string
  totalRowClassName?: string
  grandTotalRowClassName?: string
  indentClassName: string
}) {
  return (
    <div>
      <h3 className={columnTitleClassName}>{column.title}</h3>
      <table className={tableClassName}>
        <thead>
          <tr>
            <th>Account</th>
            <th className={amountClassName}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {column.lines.map((line) => (
            <BalanceSheetRow
              key={line.key}
              line={line}
              amountClassName={amountClassName}
              sectionRowClassName={sectionRowClassName}
              totalRowClassName={totalRowClassName}
              grandTotalRowClassName={grandTotalRowClassName}
              indentClassName={indentClassName}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BalanceSheetRow({
  line,
  amountClassName,
  sectionRowClassName,
  totalRowClassName,
  grandTotalRowClassName,
  indentClassName,
}: {
  line: BalanceSheetLine
  amountClassName: string
  sectionRowClassName: string
  totalRowClassName?: string
  grandTotalRowClassName?: string
  indentClassName: string
}) {
  if (line.isSection) {
    return (
      <tr className={sectionRowClassName}>
        <td colSpan={2}>{line.label}</td>
      </tr>
    )
  }

  const rowClass = line.isTotal
    ? line.key === 'total-assets' || line.key === 'total-liabilities-equity'
      ? grandTotalRowClassName
      : totalRowClassName
    : undefined
  const indentClass = line.indent > 0 ? indentClassName : undefined

  return (
    <tr className={rowClass}>
      <td className={indentClass}>{line.label}</td>
      <td className={amountClassName}>{formatBalanceSheetMoney(line.amount)}</td>
    </tr>
  )
}

function BalanceSheetPrintView({ report }: { report: BalanceSheetReport }) {
  return (
    <ReportDocument
      title="Balance Sheet"
      subtitle={`As of ${formatBalanceSheetDate(report.asOfDate)}`}
      footerNote={
        report.balanced
          ? 'The balance sheet is balanced.'
          : 'The balance sheet is out of balance. Review your books and transactions.'
      }
    >
      <table className={doc.summaryTable}>
        <tbody>
          <tr>
            <td>Total Assets</td>
            <td>{formatBalanceSheetMoney(report.assets.total)}</td>
          </tr>
          <tr>
            <td>Total Liabilities &amp; Equity</td>
            <td>{formatBalanceSheetMoney(report.liabilitiesAndEquity.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className={doc.columns}>
        <BalanceSheetColumnTable
          column={report.assets}
          tableClassName={doc.reportTable}
          columnTitleClassName={doc.columnTitle}
          amountClassName={doc.amountCol}
          sectionRowClassName={doc.sectionRow}
          totalRowClassName={doc.totalRow}
          grandTotalRowClassName={doc.grandTotalRow}
          indentClassName={doc.indentCell}
        />
        <BalanceSheetColumnTable
          column={report.liabilitiesAndEquity}
          tableClassName={doc.reportTable}
          columnTitleClassName={doc.columnTitle}
          amountClassName={doc.amountCol}
          sectionRowClassName={doc.sectionRow}
          totalRowClassName={doc.totalRow}
          grandTotalRowClassName={doc.grandTotalRow}
          indentClassName={doc.indentCell}
        />
      </div>
    </ReportDocument>
  )
}

export function BalanceSheetPage() {
  const [report, setReport] = useState<BalanceSheetReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [asOfDate, setAsOfDate] = useState(todayIsoDate)

  const loadReport = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchBalanceSheetReport({ asOfDate })
      setReport(response)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load balance sheet.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [asOfDate])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  return (
    <ModulePage
      title="Balance Sheet"
      description="Assets, liabilities, and equity as of a selected date. Cash and bank balances come from your books."
      actions={report && !isLoading ? <ReportPrintButton /> : undefined}
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <div className={styles.filtersRow}>
            <div className={styles.dateField}>
              <label htmlFor="balance-sheet-date">As of</label>
              <input
                id="balance-sheet-date"
                type="date"
                value={asOfDate}
                onChange={(event) => setAsOfDate(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.reportBody}>
            {isLoading ? (
              <p className={styles.stateText}>Loading balance sheet...</p>
            ) : !report ? (
              <p className={styles.stateText}>Select a date to generate the balance sheet.</p>
            ) : (
              <>
                <section className={styles.summaryGrid}>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Total Assets</span>
                    <strong>{formatBalanceSheetMoney(report.assets.total)}</strong>
                    <span className={styles.summaryHint}>
                      As of {formatBalanceSheetDate(report.asOfDate)}
                    </span>
                  </article>
                  <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Total Liabilities & Equity</span>
                    <strong>{formatBalanceSheetMoney(report.liabilitiesAndEquity.total)}</strong>
                    <span className={styles.summaryHint}>Liabilities and equity combined</span>
                  </article>
                  <article
                    className={[styles.summaryCard, styles.summaryCardHighlight].join(' ')}
                  >
                    <span className={styles.summaryLabel}>Report Status</span>
                    <strong>
                      <span
                        className={[
                          styles.balancedBadge,
                          report.balanced ? styles.balancedOk : styles.balancedWarn,
                        ].join(' ')}
                      >
                        {report.balanced ? 'Balanced' : 'Out of balance'}
                      </span>
                    </strong>
                    <span className={styles.summaryHint}>
                      Retained earnings is calculated to balance the sheet
                    </span>
                  </article>
                </section>

                <div className={styles.columns}>
                  <BalanceSheetColumnTable
                    column={report.assets}
                    tableClassName={styles.reportTable}
                    columnTitleClassName={styles.columnTitle}
                    amountClassName={styles.amountCol}
                    sectionRowClassName={styles.sectionRow}
                    totalRowClassName={styles.totalRow}
                    indentClassName={styles.indent1}
                  />
                  <BalanceSheetColumnTable
                    column={report.liabilitiesAndEquity}
                    tableClassName={styles.reportTable}
                    columnTitleClassName={styles.columnTitle}
                    amountClassName={styles.amountCol}
                    sectionRowClassName={styles.sectionRow}
                    totalRowClassName={styles.totalRow}
                    indentClassName={styles.indent1}
                  />
                </div>

                <BalanceSheetPrintView report={report} />
              </>
            )}
          </div>
        </section>
      </div>
    </ModulePage>
  )
}
