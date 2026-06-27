import { useMemo } from 'react'
import { Banknote, Eye, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import {
  formatPayableDate,
  formatPayableMoney,
  type Payable,
} from '@/types/payable'
import type { TableColumn } from '@/types/table'
import styles from './PayableTable.module.css'

interface PayableTableProps {
  payables: Payable[]
  isLoading?: boolean
  onView: (payable: Payable) => void
  onRecordPayment: (payable: Payable) => void
  onDelete: (payable: Payable) => void
}

export function PayableTable({
  payables,
  isLoading = false,
  onView,
  onRecordPayment,
  onDelete,
}: PayableTableProps) {
  const columns = useMemo<TableColumn<Payable>[]>(
    () => [
      {
        key: 'id',
        header: 'ID',
        render: (payable) => (
          <span className={styles.idCell}>#{payable.id}</span>
        ),
      },
      {
        key: 'vendor',
        header: 'Vendor',
        render: (payable) => payable.vendor?.name ?? '—',
      },
      {
        key: 'bill',
        header: 'Bill',
        render: (payable) => (
          <span className={styles.cellMuted}>
            {payable.bill?.billNumber ?? '—'}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Payment Method',
        render: (payable) => (
          <span className={styles.cellMuted}>
            {payable.status === 'paid'
              ? (payable.paymentMethod?.name ?? '—')
              : '—'}
          </span>
        ),
      },
      {
        key: 'dueDate',
        header: 'Due Date',
        render: (payable) =>
          payable.dueDate ? formatPayableDate(payable.dueDate) : '—',
      },
      {
        key: 'createdAt',
        header: 'Creation',
        render: (payable) => (
          <div className={styles.creationCell}>
            <span>{formatPayableDate(payable.createdAt)}</span>
            <span className={styles.cellMuted}>
              {payable.createdBy?.username ?? '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (payable) => (
          <span className={styles.amount}>{formatPayableMoney(payable.amount)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (payable) => (
          <Badge variant={payable.status === 'paid' ? 'success' : 'neutral'}>
            {payable.status === 'paid' ? 'Paid' : 'Unpaid'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (payable) => (
          <div className={styles.rowActions}>
            <ActionIconButton
              variant="view"
              label={`View payable #${payable.id}`}
              onClick={() => onView(payable)}
            >
              <Eye size={15} />
            </ActionIconButton>
            {payable.status === 'unpaid' ? (
              <ActionIconButton
                variant="edit"
                label={`Record payment for payable #${payable.id}`}
                onClick={() => onRecordPayment(payable)}
              >
                <Banknote size={15} />
              </ActionIconButton>
            ) : null}
            {!payable.billId ? (
              <ActionIconButton
                variant="delete"
                label={`Delete payable #${payable.id}`}
                onClick={() => onDelete(payable)}
              >
                <Trash2 size={15} />
              </ActionIconButton>
            ) : null}
          </div>
        ),
      },
    ],
    [onView, onRecordPayment, onDelete],
  )

  return (
    <Table
      data={payables}
      columns={columns}
      rowKey={(payable) => String(payable.id)}
      isLoading={isLoading}
      loadingMessage="Loading payables..."
      emptyMessage="No payables yet. Create a bill or add a payable manually."
    />
  )
}
