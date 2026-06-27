import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Table } from '@/components/ui/Table'
import {
  formatSalesDate,
  formatSalesDateLong,
  formatSalesMoney,
  type SalesEntry,
} from '@/types/sales'
import type { TableColumn } from '@/types/table'
import styles from './SalesEntryTable.module.css'

interface SalesEntryTableProps {
  entries: SalesEntry[]
  isLoading?: boolean
  showDateColumn?: boolean
  onViewReceipt?: (entry: SalesEntry) => void
}

export function SalesEntryTable({
  entries,
  isLoading = false,
  showDateColumn = false,
  onViewReceipt,
}: SalesEntryTableProps) {
  const columns = useMemo<TableColumn<SalesEntry>[]>(
    () => [
      ...(showDateColumn
        ? [
            {
              key: 'date',
              header: 'Date',
              render: (entry: SalesEntry) => (
                <span className={styles.cellMuted}>
                  {formatSalesDate(entry.saleDate)}
                </span>
              ),
            } satisfies TableColumn<SalesEntry>,
          ]
        : []),
      {
        key: 'time',
        header: 'Time',
        render: (entry) => (
          <span className={styles.cellMuted}>
            {formatSalesDateLong(entry.createdAt)}
          </span>
        ),
      },
      {
        key: 'voucher',
        header: 'Voucher #',
        render: (entry) => (
          <span className={styles.voucherNumber}>
            {entry.receiptVoucher?.voucherNumber ?? '—'}
          </span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (entry) => entry.customer?.name ?? '—',
      },
      {
        key: 'invoice',
        header: 'Invoice',
        render: (entry) => (
          <span className={styles.cellMuted}>
            {entry.invoice?.invoiceNumber ?? '—'}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Payment',
        render: (entry) => (
          <span className={styles.cellMuted}>
            {entry.paymentMethod?.name ?? '—'}
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        render: (entry) => (
          <span className={styles.amount}>{formatSalesMoney(entry.amount)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (entry) =>
          onViewReceipt ? (
            <ActionIconButton
              variant="view"
              label={`View receipt ${entry.receiptVoucher?.voucherNumber ?? entry.id}`}
              onClick={() => onViewReceipt(entry)}
            >
              <Eye size={15} />
            </ActionIconButton>
          ) : null,
      },
    ],
    [onViewReceipt, showDateColumn],
  )

  return (
    <Table
      data={entries}
      columns={columns}
      rowKey={(entry) => String(entry.id)}
      isLoading={isLoading}
      loadingMessage="Loading sales..."
      emptyMessage="No sales recorded for this period. Record a receipt from Accounts Receivable."
    />
  )
}
