import { useMemo } from 'react'
import { Table } from '@/components/ui/Table'
import {
  cashEntryTypeLabel,
  formatCashDate,
  formatCashDateLong,
  formatCashMoney,
  type CashEntry,
} from '@/types/cash'
import type { TableColumn } from '@/types/table'
import styles from './CashEntryTable.module.css'

interface CashEntryTableProps {
  entries: CashEntry[]
  isLoading?: boolean
  showDateColumn?: boolean
}

export function CashEntryTable({
  entries,
  isLoading = false,
  showDateColumn = false,
}: CashEntryTableProps) {
  const columns = useMemo<TableColumn<CashEntry>[]>(
    () => [
      ...(showDateColumn
        ? [
            {
              key: 'date',
              header: 'Date',
              render: (entry: CashEntry) => (
                <span className={styles.cellMuted}>
                  {formatCashDate(entry.entryDate)}
                </span>
              ),
            } satisfies TableColumn<CashEntry>,
          ]
        : []),
      {
        key: 'time',
        header: 'Time',
        render: (entry) => (
          <span className={styles.cellMuted}>
            {formatCashDateLong(entry.createdAt)}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (entry) => (
          <span className={styles.typeBadge}>{cashEntryTypeLabel(entry.type)}</span>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        render: (entry) => (
          <div className={styles.descriptionCell}>
            <span>{entry.description}</span>
            {entry.expense?.category?.name ? (
              <span className={styles.cellMuted}>
                Manage in Expenses #{entry.expense.id}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'in',
        header: 'In',
        align: 'right',
        render: (entry) =>
          entry.direction === 'in' ? (
            <span className={styles.amountIn}>{formatCashMoney(entry.amount)}</span>
          ) : (
            <span className={styles.cellMuted}>—</span>
          ),
      },
      {
        key: 'out',
        header: 'Out',
        align: 'right',
        render: (entry) =>
          entry.direction === 'out' ? (
            <span className={styles.amountOut}>{formatCashMoney(entry.amount)}</span>
          ) : (
            <span className={styles.cellMuted}>—</span>
          ),
      },
      {
        key: 'balance',
        header: 'Balance',
        align: 'right',
        render: (entry) => (
          <span className={styles.balance}>
            {formatCashMoney(entry.runningBalance ?? 0)}
          </span>
        ),
      },
    ],
    [showDateColumn],
  )

  return (
    <Table
      data={entries}
      columns={columns}
      rowKey={(entry) => String(entry.id)}
      isLoading={isLoading}
      loadingMessage="Loading cash entries..."
      emptyMessage="No cash movements for this period."
    />
  )
}
