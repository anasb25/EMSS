import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PaginationMeta } from '@/types/pagination'
import styles from './Pagination.module.css'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.total === 0) return null

  const pages = getPageNumbers(meta.page, meta.totalPages)
  const from = (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.total)

  return (
    <div className={styles.pagination}>
      <p className={styles.summary}>
        Showing <strong>{from}</strong>–<strong>{to}</strong> of{' '}
        <strong>{meta.total}</strong>
      </p>

      <div className={styles.controls}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className={styles.pages}>
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={[
                styles.pageButton,
                page === meta.page ? styles.pageButtonActive : '',
              ].join(' ')}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === meta.page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
