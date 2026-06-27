import { useMemo } from 'react'
import { Banknote, Eye, FileText } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import {
  formatLedgerDate,
  formatLedgerMoney,
  ledgerEntryTypeLabel,
  type CustomerLedgerEntry,
} from '@/types/customer-ledger'
import type { TableColumn } from '@/types/table'
import styles from './CustomerLedgerTable.module.css'

interface CustomerLedgerTableProps {
  entries: CustomerLedgerEntry[]
  isLoading?: boolean
  onRecordReceipt?: (entry: CustomerLedgerEntry) => void
  onViewInvoice?: (entry: CustomerLedgerEntry) => void
  onViewVoucher?: (entry: CustomerLedgerEntry) => void
}

function formatAmount(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return formatLedgerMoney(value)
}

export function CustomerLedgerTable({
  entries,
  isLoading = false,
  onRecordReceipt,
  onViewInvoice,
  onViewVoucher,
}: CustomerLedgerTableProps) {
  const columns = useMemo<TableColumn<CustomerLedgerEntry>[]>(
    () => [
      {
        key: 'date',
        header: 'Date',
        render: (entry) => formatLedgerDate(entry.date),
      },
      {
        key: 'reference',
        header: 'Reference',
        render: (entry) => (
          <span className={styles.reference}>{entry.reference}</span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (entry) => (
          <Badge
            variant={
              entry.type === 'payment'
                ? 'success'
                : entry.isOverdue
                  ? 'danger'
                  : 'neutral'
            }
          >
            {ledgerEntryTypeLabel(entry.type)}
          </Badge>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        render: (entry) => (
          <div className={styles.descriptionCell}>
            <span>{entry.description}</span>
            {entry.isOverdue ? (
              <span className={styles.overdue}>Overdue</span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'debit',
        header: 'Debit',
        align: 'right',
        render: (entry) => (
          <span className={entry.debit ? styles.debit : styles.muted}>
            {formatAmount(entry.debit)}
          </span>
        ),
      },
      {
        key: 'credit',
        header: 'Credit',
        align: 'right',
        render: (entry) => (
          <span className={entry.credit ? styles.credit : styles.muted}>
            {formatAmount(entry.credit)}
          </span>
        ),
      },
      {
        key: 'balance',
        header: 'Balance',
        align: 'right',
        render: (entry) => (
          <span className={styles.balance}>{formatLedgerMoney(entry.runningBalance)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (entry) => (
          <div className={styles.rowActions}>
            {entry.type !== 'payment' &&
            entry.status === 'unpaid' &&
            entry.receivableId &&
            onRecordReceipt ? (
              <ActionIconButton
                variant="edit"
                label={`Record receipt for ${entry.reference}`}
                onClick={() => onRecordReceipt(entry)}
              >
                <Banknote size={15} />
              </ActionIconButton>
            ) : null}
            {entry.invoiceId && onViewInvoice ? (
              <ActionIconButton
                variant="view"
                label={`View invoice ${entry.reference}`}
                onClick={() => onViewInvoice(entry)}
              >
                <FileText size={15} />
              </ActionIconButton>
            ) : null}
            {entry.type === 'payment' && entry.receiptVoucherId && onViewVoucher ? (
              <ActionIconButton
                variant="view"
                label={`View receipt ${entry.reference}`}
                onClick={() => onViewVoucher(entry)}
              >
                <Eye size={15} />
              </ActionIconButton>
            ) : null}
          </div>
        ),
      },
    ],
    [onRecordReceipt, onViewInvoice, onViewVoucher],
  )

  return (
    <Table
      data={entries}
      columns={columns}
      rowKey={(entry) => entry.id}
      isLoading={isLoading}
      loadingMessage="Loading ledger..."
      emptyMessage="No ledger entries match your filters."
    />
  )
}
