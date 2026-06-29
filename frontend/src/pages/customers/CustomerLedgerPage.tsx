import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchCustomerLedger } from '@/api/customers'
import {
  fetchReceiptVoucher,
  fetchReceiptVoucherByReceivable,
} from '@/api/receipt-vouchers'
import { fetchReceivable, recordReceipt } from '@/api/receivables'
import { CustomerLedgerTable } from '@/components/customers/CustomerLedgerTable'
import { CustomerLedgerPrintDocument } from '@/components/customers/CustomerLedgerPrintDocument'
import { ModulePage } from '@/components/common/ModulePage'
import { PeriodFilters } from '@/components/common/PeriodFilters'
import { ReportPrintButton } from '@/components/reports/ReportPrintButton'
import { ReceiptVoucherDetailsModal } from '@/components/receipt-vouchers/ReceiptVoucherDetailsModal'
import { RecordReceiptForm } from '@/components/receivables/RecordReceiptForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { ROUTES } from '@/config/routes'
import { useModal } from '@/hooks/useModal'
import {
  formatLedgerMoney,
  type CustomerLedger,
  type CustomerLedgerEntry,
  type CustomerLedgerStatusFilter,
  type CustomerLedgerTypeFilter,
} from '@/types/customer-ledger'
import { getPeriodRange, type PeriodFilter } from '@/types/period-filter'
import type { Receivable, RecordReceiptFormData } from '@/types/receivable'
import type { ReceiptVoucher } from '@/types/receipt-voucher'
import styles from './CustomerLedgerPage.module.css'

const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: CustomerLedgerStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Paid', value: 'paid' },
]

const TYPE_FILTERS: { label: string; value: CustomerLedgerTypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: 'Invoices', value: 'invoice' },
  { label: 'Receivables', value: 'manual_receivable' },
  { label: 'Payments', value: 'payment' },
]

export function CustomerLedgerPage() {
  const { customerId = '' } = useParams()
  const navigate = useNavigate()
  const [ledger, setLedger] = useState<CustomerLedger | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerLedgerStatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<CustomerLedgerTypeFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const receiptModal = useModal<Receivable>()
  const voucherViewModal = useModal<ReceiptVoucher>()

  const dateRange = useMemo(
    () => getPeriodRange(periodFilter, customDateFrom, customDateTo),
    [periodFilter, customDateFrom, customDateTo],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadLedger = useCallback(async () => {
    if (!customerId) return

    setIsLoading(true)
    setError('')

    try {
      const data = await fetchCustomerLedger(customerId, {
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      })
      setLedger(data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load customer ledger.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    customerId,
    debouncedSearch,
    statusFilter,
    typeFilter,
    dateRange.dateFrom,
    dateRange.dateTo,
  ])

  useEffect(() => {
    void loadLedger()
  }, [loadLedger])

  async function handleRecordReceipt(data: RecordReceiptFormData) {
    if (!receiptModal.data) return

    await recordReceipt(receiptModal.data.id, data)
    receiptModal.close()
    await loadLedger()
  }

  async function handleOpenRecordReceipt(entry: CustomerLedgerEntry) {
    if (!entry.receivableId) return

    setError('')
    try {
      const receivable = await fetchReceivable(entry.receivableId)
      receiptModal.open(receivable)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load receivable.',
      )
    }
  }

  async function handleViewVoucher(entry: CustomerLedgerEntry) {
    if (!entry.receiptVoucherId && !entry.receivableId) return

    setError('')
    try {
      const voucher = entry.receiptVoucherId
        ? await fetchReceiptVoucher(entry.receiptVoucherId)
        : await fetchReceiptVoucherByReceivable(entry.receivableId!)
      voucherViewModal.open(voucher)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load receipt voucher.',
      )
    }
  }

  function handleViewInvoice(entry: CustomerLedgerEntry) {
    if (!entry.invoiceId) return
    navigate(`${ROUTES.invoices}/${entry.invoiceId}`)
  }

  const customer = ledger?.customer
  const summary = ledger?.summary

  return (
    <ModulePage
      title={customer ? `${customer.name} — Ledger` : 'Customer Ledger'}
      description="Statement of charges, payments, and running balance for this customer."
      actions={
        <div className={styles.headerActions}>
          <ReportPrintButton disabled={isLoading || !ledger} />
          <Button variant="secondary" onClick={() => navigate(ROUTES.customers)}>
            <ArrowLeft size={16} strokeWidth={2} />
            Customers
          </Button>
        </div>
      }
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        {customer ? (
          <section className={styles.customerBar}>
            <div>
              <p className={styles.customerLabel}>Customer</p>
              <h2 className={styles.customerName}>{customer.name}</h2>
              <p className={styles.customerMeta}>
                {customer.trnNumber ? `TRN ${customer.trnNumber}` : 'No TRN'}
                {customer.email ? ` · ${customer.email}` : ''}
              </p>
            </div>
            <Link to={ROUTES.customers} className={styles.profileLink}>
              View profile
            </Link>
          </section>
        ) : null}

        {summary ? (
          <section className={styles.summaryGrid}>
            <Card className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Total charged</p>
              <p className={styles.summaryValue}>{formatLedgerMoney(summary.totalCharges)}</p>
            </Card>
            <Card className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Total paid</p>
              <p className={[styles.summaryValue, styles.summarySuccess].join(' ')}>
                {formatLedgerMoney(summary.totalPayments)}
              </p>
            </Card>
            <Card className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Balance due</p>
              <p
                className={[
                  styles.summaryValue,
                  summary.closingBalance > 0 ? styles.summaryWarning : '',
                ].join(' ')}
              >
                {formatLedgerMoney(summary.closingBalance)}
              </p>
              <p className={styles.summaryHint}>
                {summary.unpaidCount} unpaid · {summary.paidCount} paid
              </p>
            </Card>
            <Card className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Overdue</p>
              <p
                className={[
                  styles.summaryValue,
                  summary.overdueAmount > 0 ? styles.summaryDanger : '',
                ].join(' ')}
              >
                {formatLedgerMoney(summary.overdueAmount)}
              </p>
            </Card>
          </section>
        ) : null}

        <section className={styles.panel}>
          <PeriodFilters
            periodFilter={periodFilter}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onPeriodChange={setPeriodFilter}
            onCustomDateFromChange={setCustomDateFrom}
            onCustomDateToChange={setCustomDateTo}
          />

          <div className={styles.toolbar}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search reference or description..."
            />

            <div className={styles.filterGroups}>
              <div className={styles.filters} role="group" aria-label="Status filter">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={[
                      styles.filterButton,
                      statusFilter === filter.value ? styles.filterButtonActive : '',
                    ].join(' ')}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className={styles.filters} role="group" aria-label="Type filter">
                {TYPE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={[
                      styles.filterButton,
                      typeFilter === filter.value ? styles.filterButtonActive : '',
                    ].join(' ')}
                    onClick={() => setTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {summary && dateRange.dateFrom ? (
            <p className={styles.openingBalance}>
              Opening balance: {formatLedgerMoney(summary.openingBalance)}
            </p>
          ) : null}

          <CustomerLedgerTable
            entries={ledger?.entries ?? []}
            isLoading={isLoading}
            onRecordReceipt={(entry) => {
              void handleOpenRecordReceipt(entry)
            }}
            onViewInvoice={handleViewInvoice}
            onViewVoucher={(entry) => {
              void handleViewVoucher(entry)
            }}
          />
        </section>
      </div>

      {ledger ? (
        <CustomerLedgerPrintDocument
          ledger={ledger}
          periodFilter={periodFilter}
          dateRange={dateRange}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          search={debouncedSearch}
        />
      ) : null}

      <ReceiptVoucherDetailsModal
        voucher={voucherViewModal.data ?? null}
        isOpen={voucherViewModal.isOpen}
        onClose={voucherViewModal.close}
      />

      <Modal
        isOpen={receiptModal.isOpen}
        title="Record Receipt"
        description="Create a receipt voucher and mark this receivable as paid."
        onClose={receiptModal.close}
        size="lg"
      >
        {receiptModal.data ? (
          <RecordReceiptForm
            receivable={receiptModal.data}
            onSubmit={handleRecordReceipt}
            onCancel={receiptModal.close}
          />
        ) : null}
      </Modal>
    </ModulePage>
  )
}
