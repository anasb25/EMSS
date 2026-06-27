import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createPayable,
  deletePayable,
  fetchPayables,
  recordPayment,
  type PayableStatusFilter,
} from '@/api/payables'
import { ModulePage } from '@/components/common/ModulePage'
import { PeriodFilters } from '@/components/common/PeriodFilters'
import { PayableDetailsModal } from '@/components/payables/PayableDetailsModal'
import { PayableForm } from '@/components/payables/PayableForm'
import { PayableTable } from '@/components/payables/PayableTable'
import { RecordPaymentForm } from '@/components/payables/RecordPaymentForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { useModal } from '@/hooks/useModal'
import type { PaginationMeta } from '@/types/pagination'
import type { Payable, PayableFormData, RecordPaymentFormData } from '@/types/payable'
import { getPeriodRange, type PeriodFilter } from '@/types/period-filter'
import styles from './AccountsPayablePage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: PayableStatusFilter }[] = [
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

export function AccountsPayablePage() {
  const [payables, setPayables] = useState<Payable[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PayableStatusFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [page, setPage] = useState(1)
  const formModal = useModal()
  const viewModal = useModal<Payable>()
  const paymentModal = useModal<Payable>()
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

  const loadPayables = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchPayables({
        search: debouncedSearch,
        status: statusFilter,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        page,
        limit: PAGE_SIZE,
      })
      setPayables(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load payables.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, dateRange.dateFrom, dateRange.dateTo, page])

  useEffect(() => {
    void loadPayables()
  }, [loadPayables])

  function handleStatusChange(nextStatus: PayableStatusFilter) {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  function handlePeriodChange(nextPeriod: PeriodFilter) {
    setPeriodFilter(nextPeriod)
    setPage(1)
  }

  async function handleSubmit(data: PayableFormData) {
    await createPayable(data)
    formModal.close()
    await loadPayables()
  }

  async function handleRecordPayment(data: RecordPaymentFormData) {
    if (!paymentModal.data) return
    await recordPayment(paymentModal.data.id, data)
    paymentModal.close()
    await loadPayables()
  }

  async function handleDelete(payable: Payable) {
    const confirmed = window.confirm(
      `Delete payable #${payable.id} for ${payable.vendor?.name ?? 'this vendor'}?`,
    )
    if (!confirmed) return

    try {
      await deletePayable(payable.id)
      if (payables.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadPayables()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete payable.',
      )
    }
  }

  return (
    <ModulePage
      title="Payments Made"
      description="Track vendor payables from bills and manual entries."
      actions={
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Add Payable
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
              placeholder="Search by vendor, bill, payment method..."
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

          <PayableTable
            payables={payables}
            isLoading={isLoading}
            onView={viewModal.open}
            onRecordPayment={paymentModal.open}
            onDelete={handleDelete}
          />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>

      <PayableDetailsModal
        payable={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
      />

      <Modal
        isOpen={formModal.isOpen}
        title="Add Payable"
        description="Record a payable manually. Choose the payment method when recording payment."
        onClose={formModal.close}
        size="lg"
        anchorRef={addButtonRef}
      >
        <PayableForm onSubmit={handleSubmit} onCancel={formModal.close} />
      </Modal>

      <Modal
        isOpen={paymentModal.isOpen}
        title="Record Payment"
        description="Mark this payable as paid and store payment details."
        onClose={paymentModal.close}
        size="lg"
      >
        {paymentModal.data ? (
          <RecordPaymentForm
            payable={paymentModal.data}
            onSubmit={handleRecordPayment}
            onCancel={paymentModal.close}
          />
        ) : null}
      </Modal>
    </ModulePage>
  )
}
