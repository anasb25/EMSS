import { useMemo } from 'react'
import { Table } from '@/components/ui/Table'
import {
  bankEntryTypeLabel,
  formatBankDate,
  formatBankDateLong,
  formatBankMoney,
  type BankEntry,
} from '@/types/bank'
import type { TableColumn } from '@/types/table'
import styles from './BankEntryTable.module.css'

interface BankEntryTableProps {
  entries: BankEntry[]
  isLoading?: boolean
  showDateColumn?: boolean
}

export function BankEntryTable({
  entries,
  isLoading = false,
  showDateColumn = false,
}: BankEntryTableProps) {
  const columns = useMemo<TableColumn<BankEntry>[]>(
    () => [
      ...(showDateColumn
        ? [
            {
              key: 'date',
              header: 'Date',
              render: (entry: BankEntry) => (
                <span className={styles.cellMuted}>
                  {formatBankDate(entry.entryDate)}
                </span>
              ),
            } satisfies TableColumn<BankEntry>,
          ]
        : []),
      {
        key: 'time',
        header: 'Time',
        render: (entry) => (
          <span className={styles.cellMuted}>
            {formatBankDateLong(entry.createdAt)}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (entry) => (
          <span className={styles.typeBadge}>{bankEntryTypeLabel(entry.type)}</span>
        ),
      },
      {
        key: 'method',
        header: 'Method',
        render: (entry) => (
          <span className={styles.methodBadge}>{entry.paymentMethod ?? '—'}</span>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        render: (entry) => (
          <div className={styles.descriptionCell}>
            <span>{entry.description}</span>
          </div>
        ),
      },
      {
        key: 'in',
        header: 'In',
        align: 'right',
        render: (entry) =>
          entry.bankIn > 0 ? (
            <span className={styles.amountIn}>{formatBankMoney(entry.bankIn)}</span>
          ) : (
            <span className={styles.cellMuted}>—</span>
          ),
      },
      {
        key: 'out',
        header: 'Out',
        align: 'right',
        render: (entry) =>
          entry.bankOut > 0 ? (
            <span className={styles.amountOut}>{formatBankMoney(entry.bankOut)}</span>
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
            {formatBankMoney(entry.runningBalance ?? 0)}
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
      loadingMessage="Loading bank entries..."
      emptyMessage="No bank movements for this period."
    />
  )
}
