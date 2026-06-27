import { useMemo } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Table } from '@/components/ui/Table'
import {
  formatExpenseDate,
  formatExpenseMoney,
  type Expense,
} from '@/types/expense'
import type { TableColumn } from '@/types/table'
import styles from './ExpenseTable.module.css'

interface ExpenseTableProps {
  expenses: Expense[]
  isLoading?: boolean
  onView: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseTable({
  expenses,
  isLoading = false,
  onView,
  onDelete,
}: ExpenseTableProps) {
  const columns = useMemo<TableColumn<Expense>[]>(
    () => [
      {
        key: 'date',
        header: 'Date',
        render: (expense) => formatExpenseDate(expense.expenseDate),
      },
      {
        key: 'category',
        header: 'Category',
        render: (expense) => (
          <span className={styles.categoryBadge}>
            {expense.category?.name ?? '—'}
          </span>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        render: (expense) => (
          <div className={styles.descriptionCell}>
            <span>{expense.description}</span>
            {expense.vendor?.name ? (
              <span className={styles.cellMuted}>{expense.vendor.name}</span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Paid Through',
        render: (expense) => (
          <span className={styles.cellMuted}>
            {expense.paymentMethod?.name ?? '—'}
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        render: (expense) => (
          <span className={styles.amount}>{formatExpenseMoney(expense.amount)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (expense) => (
          <>
            <ActionIconButton
              variant="view"
              label={`View expense #${expense.id}`}
              onClick={() => onView(expense)}
            >
              <Eye size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="delete"
              label={`Delete expense #${expense.id}`}
              onClick={() => onDelete(expense)}
            >
              <Trash2 size={15} />
            </ActionIconButton>
          </>
        ),
      },
    ],
    [onView, onDelete],
  )

  return (
    <Table
      data={expenses}
      columns={columns}
      rowKey={(expense) => String(expense.id)}
      isLoading={isLoading}
      loadingMessage="Loading expenses..."
      emptyMessage="No expenses yet. Record a pay-now expense to get started."
    />
  )
}
