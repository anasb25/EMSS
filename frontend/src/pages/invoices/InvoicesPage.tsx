import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchInvoices } from '@/api/invoices'
import { InvoiceTable } from '@/components/invoices/InvoiceTable'
import { ModulePage } from '@/components/common/ModulePage'
import { PeriodFilters } from '@/components/common/PeriodFilters'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { ROUTES } from '@/config/routes'
import type { Invoice } from '@/types/invoice'
import type { PaginationMeta } from '@/types/pagination'
import { getPeriodRange, type PeriodFilter } from '@/types/period-filter'
import styles from './InvoicesPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function InvoicesPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [page, setPage] = useState(1)

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

  const loadInvoices = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetchInvoices({
        search: debouncedSearch,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        page,
        limit: PAGE_SIZE,
      })
      setInvoices(response.data)
      setMeta(response.meta)
    } catch {
      setError('Failed to load invoices.')
      setInvoices([])
      setMeta(EMPTY_META)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, dateRange.dateFrom, dateRange.dateTo, page])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  function handlePeriodChange(nextPeriod: PeriodFilter) {
    setPeriodFilter(nextPeriod)
    setPage(1)
  }

  function handleEdit(invoice: Invoice) {
    navigate(ROUTES.invoiceEdit.replace(':invoiceId', invoice.id))
  }

  function handleView(invoice: Invoice) {
    navigate(`${ROUTES.invoices}/${invoice.id}`)
  }

  return (
    <ModulePage
      title="Invoices"
      description="Issue invoices, track billing, and view invoice details."
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
              placeholder="Search by invoice #, job card, or customer…"
            />
          </div>

          <InvoiceTable
            invoices={invoices}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
          />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>
    </ModulePage>
  )
}
