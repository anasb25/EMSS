import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createBill, fetchBills } from '@/api/bills'
import { BillForm } from '@/components/bills/BillForm'
import { BillTable } from '@/components/bills/BillTable'
import { ModulePage } from '@/components/common/ModulePage'
import { PeriodFilters } from '@/components/common/PeriodFilters'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { ROUTES } from '@/config/routes'
import { useModal } from '@/hooks/useModal'
import type { Bill, BillFormData } from '@/types/bill'
import type { PaginationMeta } from '@/types/pagination'
import { getPeriodRange, type PeriodFilter } from '@/types/period-filter'
import styles from './BillsPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function BillsPage() {
  const navigate = useNavigate()
  const [bills, setBills] = useState<Bill[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [page, setPage] = useState(1)
  const formModal = useModal()
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

  const loadBills = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchBills({
        search: debouncedSearch,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        page,
        limit: PAGE_SIZE,
      })
      setBills(response.data)
      setMeta(response.meta)
    } catch {
      setError('Failed to load bills.')
      setBills([])
      setMeta(EMPTY_META)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, dateRange.dateFrom, dateRange.dateTo, page])

  useEffect(() => {
    void loadBills()
  }, [loadBills])

  function handlePeriodChange(nextPeriod: PeriodFilter) {
    setPeriodFilter(nextPeriod)
    setPage(1)
  }

  async function handleSubmit(data: BillFormData) {
    const bill = await createBill(data)
    formModal.close()
    navigate(`${ROUTES.bills}/${bill.id}`)
  }

  function handleView(bill: Bill) {
    navigate(`${ROUTES.bills}/${bill.id}`)
  }

  return (
    <ModulePage
      title="Bills"
      description="Record vendor bills for goods and services purchased."
      actions={
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Create Bill
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
              placeholder="Search by bill #, vendor, or reference..."
            />
          </div>

          <BillTable bills={bills} isLoading={isLoading} onView={handleView} />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>

      <Modal
        isOpen={formModal.isOpen}
        title="Create Bill"
        description="Enter vendor bill details and line items. A payable will be created automatically."
        onClose={formModal.close}
        size="lg"
        anchorRef={addButtonRef}
      >
        <BillForm onSubmit={handleSubmit} onCancel={formModal.close} />
      </Modal>
    </ModulePage>
  )
}
