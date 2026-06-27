import { Modal } from '@/components/ui/Modal'
import {
  formatExpenseDate,
  formatExpenseDateLong,
  formatExpenseMoney,
  type Expense,
} from '@/types/expense'
import styles from './ExpenseDetailsModal.module.css'

interface ExpenseDetailsModalProps {
  expense: Expense | null
  isOpen: boolean
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  )
}

export function ExpenseDetailsModal({
  expense,
  isOpen,
  onClose,
}: ExpenseDetailsModalProps) {
  if (!expense) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      title={`Expense #${expense.id}`}
      description="Pay-now expense details."
      onClose={onClose}
      size="md"
    >
      <div className={styles.content}>
        <div className={styles.summary}>
          <strong>{formatExpenseMoney(expense.amount)}</strong>
          <span>{expense.category?.name ?? 'Uncategorized'}</span>
        </div>

        <div className={styles.details}>
          <DetailRow label="Date" value={formatExpenseDate(expense.expenseDate)} />
          <DetailRow
            label="Category"
            value={expense.category?.name ?? '—'}
          />
          <DetailRow label="Description" value={expense.description} />
          <DetailRow
            label="Amount (before VAT)"
            value={formatExpenseMoney(expense.subtotal ?? expense.amount)}
          />
          <DetailRow
            label="VAT"
            value={
              expense.includeVat
                ? `${formatExpenseMoney(expense.vatAmount)} (${expense.vatPercent}%)`
                : '—'
            }
          />
          <DetailRow label="Total Paid" value={formatExpenseMoney(expense.amount)} />
          <DetailRow
            label="Paid Through"
            value={expense.paymentMethod?.name ?? '—'}
          />
          <DetailRow label="Vendor" value={expense.vendor?.name ?? '—'} />
          <DetailRow
            label="Recorded"
            value={formatExpenseDateLong(expense.createdAt)}
          />
          <DetailRow
            label="Created By"
            value={expense.createdBy?.username ?? '—'}
          />
          <DetailRow label="Notes" value={expense.notes ?? '—'} />
        </div>
      </div>
    </Modal>
  )
}
