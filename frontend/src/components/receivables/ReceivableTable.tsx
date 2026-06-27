import { useMemo } from 'react'
import { Banknote, Eye, FileText, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import {
  formatReceivableDate,
  formatReceivableMoney,
  type Receivable,
} from '@/types/receivable'
import type { TableColumn } from '@/types/table'
import styles from './ReceivableTable.module.css'

interface ReceivableTableProps {
  receivables: Receivable[]
  isLoading?: boolean
  onView: (receivable: Receivable) => void
  onRecordReceipt: (receivable: Receivable) => void
  onViewReceiptVoucher: (receivable: Receivable) => void
  onDelete: (receivable: Receivable) => void
}

export function ReceivableTable({
  receivables,
  isLoading = false,
  onView,
  onRecordReceipt,
  onViewReceiptVoucher,
  onDelete,
}: ReceivableTableProps) {
  const columns = useMemo<TableColumn<Receivable>[]>(
    () => [
      {
        key: 'id',
        header: 'ID',
        render: (receivable) => (
          <span className={styles.idCell}>#{receivable.id}</span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (receivable) => receivable.customer?.name ?? '—',
      },
      {
        key: 'invoice',
        header: 'Invoice',
        render: (receivable) => (
          <span className={styles.cellMuted}>
            {receivable.invoice?.invoiceNumber ?? '—'}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Payment Method',
        render: (receivable) => (
          <span className={styles.cellMuted}>
            {receivable.paymentMethod?.name ?? '—'}
          </span>
        ),
      },
      {
        key: 'dueDate',
        header: 'Due Date',
        render: (receivable) =>
          receivable.dueDate ? formatReceivableDate(receivable.dueDate) : '—',
      },
      {
        key: 'createdAt',
        header: 'Creation',
        render: (receivable) => (
          <div className={styles.creationCell}>
            <span>{formatReceivableDate(receivable.createdAt)}</span>
            <span className={styles.cellMuted}>
              {receivable.createdBy?.username ?? '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (receivable) => (
          <span className={styles.amount}>{formatReceivableMoney(receivable.amount)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (receivable) => (
          <Badge variant={receivable.status === 'paid' ? 'success' : 'neutral'}>
            {receivable.status === 'paid' ? 'Paid' : 'Unpaid'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (receivable) => (
          <div className={styles.rowActions}>
            <ActionIconButton
              variant="view"
              label={`View receivable #${receivable.id}`}
              onClick={() => onView(receivable)}
            >
              <Eye size={15} />
            </ActionIconButton>
            {receivable.status === 'unpaid' ? (
              <ActionIconButton
                variant="edit"
                label={`Record receipt for receivable #${receivable.id}`}
                onClick={() => onRecordReceipt(receivable)}
              >
                <Banknote size={15} />
              </ActionIconButton>
            ) : null}
            {receivable.status === 'paid' && receivable.receiptVoucher ? (
              <ActionIconButton
                variant="view"
                label={`View receipt voucher ${receivable.receiptVoucher.voucherNumber}`}
                onClick={() => onViewReceiptVoucher(receivable)}
              >
                <FileText size={15} />
              </ActionIconButton>
            ) : null}
            {!receivable.invoiceId ? (
              <ActionIconButton
                variant="delete"
                label={`Delete receivable #${receivable.id}`}
                onClick={() => onDelete(receivable)}
              >
                <Trash2 size={15} />
              </ActionIconButton>
            ) : null}
          </div>
        ),
      },
    ],
    [onView, onRecordReceipt, onViewReceiptVoucher, onDelete],
  )

  return (
    <Table
      data={receivables}
      columns={columns}
      rowKey={(receivable) => String(receivable.id)}
      isLoading={isLoading}
      loadingMessage="Loading receivables..."
      emptyMessage="No receivables yet. Generate an invoice or add a receivable manually."
    />
  )
}
