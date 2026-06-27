import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createReceivable,
  deleteReceivable,
  fetchReceivables,
  recordReceipt,
  type ReceivableStatusFilter,
} from '@/api/receivables'
import {
  fetchReceiptVoucher,
  fetchReceiptVoucherByReceivable,
} from '@/api/receipt-vouchers'
import { ModulePage } from '@/components/common/ModulePage'
import { PeriodFilters } from '@/components/common/PeriodFilters'
import { ReceiptVoucherDetailsModal } from '@/components/receipt-vouchers/ReceiptVoucherDetailsModal'
import { ReceivableDetailsModal } from '@/components/receivables/ReceivableDetailsModal'
import { ReceivableForm } from '@/components/receivables/ReceivableForm'
import { ReceivableTable } from '@/components/receivables/ReceivableTable'
import { RecordReceiptForm } from '@/components/receivables/RecordReceiptForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { useModal } from '@/hooks/useModal'
import type { PaginationMeta } from '@/types/pagination'
import type { Receivable, ReceivableFormData, RecordReceiptFormData } from '@/types/receivable'
import type { ReceiptVoucher } from '@/types/receipt-voucher'
import { getPeriodRange, type PeriodFilter } from '@/types/period-filter'
import styles from './AccountsReceivablePage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: ReceivableStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Paid', value: 'paid' },
]

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function AccountsReceivablePage() {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReceivableStatusFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [page, setPage] = useState(1)
  const formModal = useModal()
  const viewModal = useModal<Receivable>()
  const receiptModal = useModal<Receivable>()
  const voucherViewModal = useModal<ReceiptVoucher>()
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const dateRange = useMemo(
    () => getPeriodRange(periodFilter, customDateFrom, customDateTo),
    [periodFilter, customDateFrom, customDateTo],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadReceivables = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchReceivables({
        search: debouncedSearch,
        status: statusFilter,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        page,
        limit: PAGE_SIZE,
      })
      setReceivables(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load receivables.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, dateRange.dateFrom, dateRange.dateTo, page])

  useEffect(() => {
    void loadReceivables()
  }, [loadReceivables])

  function handleStatusChange(nextStatus: ReceivableStatusFilter) {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  function handlePeriodChange(nextPeriod: PeriodFilter) {
    setPeriodFilter(nextPeriod)
    setPage(1)
  }

  async function handleSubmit(data: ReceivableFormData) {
    await createReceivable(data)
    formModal.close()
    await loadReceivables()
  }

  async function handleRecordReceipt(data: RecordReceiptFormData) {
    if (!receiptModal.data) return
    await recordReceipt(receiptModal.data.id, data)
    receiptModal.close()
    await loadReceivables()
  }

  async function handleViewReceiptVoucher(receivable: Receivable) {
    setError('')
    try {
      const voucher = receivable.receiptVoucher
        ? await fetchReceiptVoucher(receivable.receiptVoucher.id)
        : await fetchReceiptVoucherByReceivable(receivable.id)
      voucherViewModal.open(voucher)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load receipt voucher.',
      )
    }
  }

  async function handleDelete(receivable: Receivable) {
    const confirmed = window.confirm(
      `Delete receivable #${receivable.id} for ${receivable.customer?.name ?? 'this customer'}?`,
    )
    if (!confirmed) return

    try {
      await deleteReceivable(receivable.id)
      if (receivables.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadReceivables()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete receivable.',
      )
    }
  }

  return (
    <ModulePage
      title="Payments Receivable"
      description="Track customer receivables from invoices and manual entries."
      actions={
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Add Receivable
        </Button>
      }
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <PeriodFilters
            periodFilter={periodFilter}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onPeriodChange={handlePeriodChange}
            onCustomDateFromChange={(value) => {
              setCustomDateFrom(value)
              setPage(1)
            }}
            onCustomDateToChange={(value) => {
              setCustomDateTo(value)
              setPage(1)
            }}
          />

          <div className={styles.toolbar}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by customer, invoice, payment method..."
            />

            <div className={styles.filters} role="group" aria-label="Status filter">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={[
                    styles.filterButton,
                    statusFilter === filter.value ? styles.filterButtonActive : '',
                  ].join(' ')}
                  onClick={() => handleStatusChange(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <ReceivableTable
            receivables={receivables}
            isLoading={isLoading}
            onView={viewModal.open}
            onRecordReceipt={receiptModal.open}
            onViewReceiptVoucher={(receivable) => {
              void handleViewReceiptVoucher(receivable)
            }}
            onDelete={handleDelete}
          />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>

      <ReceivableDetailsModal
        receivable={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
      />

      <ReceiptVoucherDetailsModal
        voucher={voucherViewModal.data ?? null}
        isOpen={voucherViewModal.isOpen}
        onClose={voucherViewModal.close}
      />

      <Modal
        isOpen={formModal.isOpen}
        title="Add Receivable"
        description="Record an unpaid receivable. Record a receipt when payment is collected."
        onClose={formModal.close}
        size="lg"
        anchorRef={addButtonRef}
      >
        <ReceivableForm onSubmit={handleSubmit} onCancel={formModal.close} />
      </Modal>

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
