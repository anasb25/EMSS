import { useMemo } from 'react'
import {
  formatLedgerDate,
  ledgerEntryTypeLabel,
  ledgerStatusFilterLabel,
  ledgerTypeFilterLabel,
  type CustomerLedger,
  type CustomerLedgerStatusFilter,
  type CustomerLedgerTypeFilter,
} from '@/types/customer-ledger'
import {
  formatPeriodDate,
  periodLabel,
  type PeriodDateRange,
  type PeriodFilter,
} from '@/types/period-filter'
import { ReportDocument } from '@/components/reports/ReportDocument'
import { reportDocumentStyles as doc } from '@/components/reports/ReportDocument'
import styles from './CustomerLedgerPrintDocument.module.css'

interface CustomerLedgerPrintDocumentProps {
  ledger: CustomerLedger
  periodFilter: PeriodFilter
  dateRange: PeriodDateRange
  statusFilter: CustomerLedgerStatusFilter
  typeFilter: CustomerLedgerTypeFilter
  search: string
}

function formatPeriodMeta(periodFilter: PeriodFilter, dateRange: PeriodDateRange): string {
  const label = periodLabel(periodFilter)

  if (dateRange.dateFrom && dateRange.dateTo) {
    return `${label} (${formatPeriodDate(dateRange.dateFrom)} – ${formatPeriodDate(dateRange.dateTo)})`
  }

  if (dateRange.dateFrom) {
    return `${label} (from ${formatPeriodDate(dateRange.dateFrom)})`
  }

  return label
}

function formatPrintAmount(value: number | null): string {
  if (value === null) return '—'

  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function CustomerLedgerPrintDocument({
  ledger,
  periodFilter,
  dateRange,
  statusFilter,
  typeFilter,
  search,
}: CustomerLedgerPrintDocumentProps) {
  const { customer, summary, entries } = ledger

  const { totalDebit, totalCredit, closingBalance } = useMemo(() => {
    const debit = entries.reduce((sum, entry) => sum + (entry.debit ?? 0), 0)
    const credit = entries.reduce((sum, entry) => sum + (entry.credit ?? 0), 0)
    const closing =
      entries.length > 0
        ? entries[entries.length - 1].runningBalance
        : summary.openingBalance

    return {
      totalDebit: debit,
      totalCredit: credit,
      closingBalance: closing,
    }
  }, [entries, summary.openingBalance])

  const meta = [
    customer.trnNumber ? `TRN ${customer.trnNumber}` : 'No TRN on file',
    customer.email ? `Email: ${customer.email}` : undefined,
    customer.phoneNumber ? `Phone: ${customer.phoneNumber}` : undefined,
  ].filter((line): line is string => Boolean(line))

  const showOpeningRow =
    summary.openingBalance !== 0 || Boolean(dateRange.dateFrom || dateRange.dateTo)

  return (
    <ReportDocument
      className={styles.ledgerDocument}
      title="Customer Account Statement"
      subtitle={customer.name}
      meta={meta}
      currencyNote="All amounts in AED. Debit = charges raised. Credit = payments received."
      footerNote="This statement reflects the filters applied on screen at the time of printing."
    >
      <section className={styles.filterPanel}>
        <div className={styles.filterGrid}>
          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Period</span>
            <span className={styles.filterValue}>
              {formatPeriodMeta(periodFilter, dateRange)}
            </span>
          </div>
          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Status</span>
            <span className={styles.filterValue}>
              {ledgerStatusFilterLabel(statusFilter)}
            </span>
          </div>
          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Type</span>
            <span className={styles.filterValue}>
              {ledgerTypeFilterLabel(typeFilter)}
            </span>
          </div>
          {search.trim() ? (
            <div className={styles.filterItem}>
              <span className={styles.filterLabel}>Search</span>
              <span className={styles.filterValue}>{search.trim()}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className={doc.columnTitle}>Account Summary</h2>
        <table className={`${doc.summaryTable} ${styles.summaryTable}`}>
          <tbody>
            {showOpeningRow ? (
              <tr>
                <td>Opening Balance</td>
                <td>{formatPrintAmount(summary.openingBalance)}</td>
              </tr>
            ) : null}
            <tr>
              <td>Total Charges (Debit)</td>
              <td>{formatPrintAmount(summary.totalCharges)}</td>
            </tr>
            <tr>
              <td>Total Payments (Credit)</td>
              <td>{formatPrintAmount(summary.totalPayments)}</td>
            </tr>
            {summary.overdueAmount > 0 ? (
              <tr>
                <td>Overdue Amount</td>
                <td>{formatPrintAmount(summary.overdueAmount)}</td>
              </tr>
            ) : null}
            <tr>
              <td>Balance Due</td>
              <td>{formatPrintAmount(summary.closingBalance)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className={doc.columnTitle}>Statement of Account</h2>
        <div className={`${doc.tableWrap} ${styles.tableWrap}`}>
          <table className={`${doc.reportTable} ${styles.ledgerTable}`}>
            <colgroup>
              <col className={styles.colDate} />
              <col className={styles.colReference} />
              <col className={styles.colDescription} />
              <col className={styles.colAmount} />
              <col className={styles.colAmount} />
              <col className={styles.colAmount} />
            </colgroup>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th className={styles.amountCol}>Debit</th>
                <th className={styles.amountCol}>Credit</th>
                <th className={styles.amountCol}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {showOpeningRow ? (
                <tr className={styles.openingRow}>
                  <td>
                    {dateRange.dateFrom
                      ? formatPeriodDate(dateRange.dateFrom)
                      : entries[0]
                        ? formatLedgerDate(entries[0].date)
                        : '—'}
                  </td>
                  <td>—</td>
                  <td>Balance brought forward</td>
                  <td className={styles.amountCol}>—</td>
                  <td className={styles.amountCol}>—</td>
                  <td className={styles.amountCol}>
                    {formatPrintAmount(summary.openingBalance)}
                  </td>
                </tr>
              ) : null}

              {entries.length ? (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className={styles.dateCell}>{formatLedgerDate(entry.date)}</td>
                    <td className={styles.referenceCell}>{entry.reference}</td>
                    <td className={styles.descriptionCell}>
                      <span className={styles.typeLabel}>
                        {ledgerEntryTypeLabel(entry.type)}
                      </span>
                      {entry.description}
                      {entry.isOverdue ? (
                        <span className={styles.overdueTag}>Overdue</span>
                      ) : null}
                    </td>
                    <td className={styles.amountCol}>{formatPrintAmount(entry.debit)}</td>
                    <td className={styles.amountCol}>{formatPrintAmount(entry.credit)}</td>
                    <td className={styles.amountCol}>
                      {formatPrintAmount(entry.runningBalance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    No ledger entries match the selected filters.
                  </td>
                </tr>
              )}

              {entries.length ? (
                <>
                  <tr className={doc.totalRow}>
                    <td colSpan={3}>Period Totals</td>
                    <td className={styles.amountCol}>{formatPrintAmount(totalDebit)}</td>
                    <td className={styles.amountCol}>{formatPrintAmount(totalCredit)}</td>
                    <td className={styles.amountCol}>—</td>
                  </tr>
                  <tr className={doc.grandTotalRow}>
                    <td colSpan={5}>Closing Balance Due</td>
                    <td className={styles.amountCol}>{formatPrintAmount(closingBalance)}</td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
        </div>

        {entries.length ? (
          <p className={styles.footnote}>
            {summary.unpaidCount} unpaid charge{summary.unpaidCount === 1 ? '' : 's'} ·{' '}
            {summary.paidCount} paid charge{summary.paidCount === 1 ? '' : 's'}
          </p>
        ) : null}
      </section>
    </ReportDocument>
  )
}
