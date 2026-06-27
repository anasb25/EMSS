import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Table } from '@/components/ui/Table'
import { formatBillDate, formatBillMoney, type Bill } from '@/types/bill'
import type { TableColumn } from '@/types/table'
import styles from './BillTable.module.css'

interface BillTableProps {
  bills: Bill[]
  isLoading?: boolean
  onView: (bill: Bill) => void
}

export function BillTable({ bills, isLoading = false, onView }: BillTableProps) {
  const columns = useMemo<TableColumn<Bill>[]>(
    () => [
      {
        key: 'billNumber',
        header: 'Bill #',
        render: (bill) => (
          <span className={styles.billNumber}>{bill.billNumber}</span>
        ),
      },
      {
        key: 'vendor',
        header: 'Vendor',
        render: (bill) => bill.vendor?.name ?? '—',
      },
      {
        key: 'vendorReference',
        header: 'Reference',
        render: (bill) => (
          <span className={styles.cellMuted}>{bill.vendorReference || '—'}</span>
        ),
      },
      {
        key: 'billDate',
        header: 'Bill Date',
        render: (bill) => formatBillDate(bill.billDate),
      },
      {
        key: 'dueDate',
        header: 'Due Date',
        render: (bill) => formatBillDate(bill.dueDate),
      },
      {
        key: 'grandTotal',
        header: 'Total',
        render: (bill) => (
          <span className={styles.total}>{formatBillMoney(bill.grandTotal)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (bill) => (
          <ActionIconButton
            label="View bill"
            variant="view"
            onClick={() => onView(bill)}
          >
            <Eye size={15} />
          </ActionIconButton>
        ),
      },
    ],
    [onView],
  )

  return (
    <Table
      columns={columns}
      data={bills}
      rowKey={(bill) => bill.id}
      isLoading={isLoading}
      loadingMessage="Loading bills..."
      emptyMessage="No bills yet. Create a bill when you purchase from a vendor."
    />
  )
}
