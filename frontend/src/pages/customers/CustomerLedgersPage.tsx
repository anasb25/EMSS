import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { fetchCustomerLedgerSummary } from '@/api/customers'
import { ModulePage } from '@/components/common/ModulePage'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Table } from '@/components/ui/Table'
import {
  customerLedgerPath,
  formatLedgerDate,
  formatLedgerMoney,
  type CustomerLedgerListItem,
  type CustomerLedgerListStatusFilter,
} from '@/types/customer-ledger'
import type { PaginationMeta } from '@/types/pagination'
import type { TableColumn } from '@/types/table'
import styles from './CustomerLedgersPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: CustomerLedgerListStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'With balance', value: 'with_balance' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function CustomerLedgersPage() {
  const [items, setItems] = useState<CustomerLedgerListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<CustomerLedgerListStatusFilter>('with_balance')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadLedgers = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetchCustomerLedgerSummary({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      })
      setItems(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load customer ledgers.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => {
    void loadLedgers()
  }, [loadLedgers])

  const columns = useMemo<TableColumn<CustomerLedgerListItem>[]>(
    () => [
      {
        key: 'customer',
        header: 'Customer',
        render: (item) => (
          <div className={styles.nameCell}>
            <strong>{item.customerName}</strong>
            {item.email ? <span>{item.email}</span> : null}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => (
          <Badge variant={item.isActive ? 'success' : 'danger'}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'outstanding',
        header: 'Balance due',
        align: 'right',
        render: (item) => (
          <span
            className={item.outstanding > 0 ? styles.outstanding : styles.muted}
          >
            {formatLedgerMoney(item.outstanding)}
          </span>
        ),
      },
      {
        key: 'totalPaid',
        header: 'Total paid',
        align: 'right',
        render: (item) => formatLedgerMoney(item.totalPaid),
      },
      {
        key: 'unpaidCount',
        header: 'Unpaid',
        align: 'right',
        render: (item) => item.unpaidCount,
      },
      {
        key: 'lastActivity',
        header: 'Last activity',
        render: (item) =>
          item.lastActivity ? formatLedgerDate(item.lastActivity) : '—',
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (item) => (
          <Link to={customerLedgerPath(item.customerId)} className={styles.ledgerLink}>
            Open ledger
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        ),
      },
    ],
    [],
  )

  return (
    <ModulePage
      title="Customer Ledgers"
      description="View receivable balances and open individual customer statements."
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by customer name, email, or TRN..."
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
                  onClick={() => {
                    setStatusFilter(filter.value)
                    setPage(1)
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <Table
            data={items}
            columns={columns}
            rowKey={(item) => item.customerId}
            isLoading={isLoading}
            loadingMessage="Loading customer ledgers..."
            emptyMessage="No customers match your filters."
          />

          {!isLoading ? <Pagination meta={meta} onPageChange={setPage} /> : null}
        </section>
      </div>
    </ModulePage>
  )
}
