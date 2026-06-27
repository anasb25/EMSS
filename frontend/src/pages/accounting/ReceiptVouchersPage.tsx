import { useCallback, useEffect, useState } from 'react'
import { fetchReceiptVouchers } from '@/api/receipt-vouchers'
import { ModulePage } from '@/components/common/ModulePage'
import { ReceiptVoucherDetailsModal } from '@/components/receipt-vouchers/ReceiptVoucherDetailsModal'
import { ReceiptVoucherTable } from '@/components/receipt-vouchers/ReceiptVoucherTable'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { useModal } from '@/hooks/useModal'
import type { PaginationMeta } from '@/types/pagination'
import type { ReceiptVoucher } from '@/types/receipt-voucher'
import styles from './ReceiptVouchersPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function ReceiptVouchersPage() {
  const [vouchers, setVouchers] = useState<ReceiptVoucher[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const viewModal = useModal<ReceiptVoucher>()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadVouchers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchReceiptVouchers({
        search: debouncedSearch,
        page,
        limit: PAGE_SIZE,
      })
      setVouchers(response.data)
      setMeta(response.meta)
    } catch {
      setError('Failed to load receipt vouchers.')
      setVouchers([])
      setMeta(EMPTY_META)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    void loadVouchers()
  }, [loadVouchers])

  return (
    <ModulePage
      title="Receipt Vouchers"
      description="View customer payment receipts recorded against receivables."
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by voucher #, customer, or invoice..."
            />
          </div>

          <ReceiptVoucherTable
            vouchers={vouchers}
            isLoading={isLoading}
            onView={viewModal.open}
          />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>

      <ReceiptVoucherDetailsModal
        voucher={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
      />
    </ModulePage>
  )
}
