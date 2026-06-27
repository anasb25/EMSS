import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Table } from '@/components/ui/Table'
import {
  formatReceiptVoucherDate,
  formatReceiptVoucherMoney,
  type ReceiptVoucher,
} from '@/types/receipt-voucher'
import type { TableColumn } from '@/types/table'
import styles from './ReceiptVoucherTable.module.css'

interface ReceiptVoucherTableProps {
  vouchers: ReceiptVoucher[]
  isLoading?: boolean
  onView: (voucher: ReceiptVoucher) => void
}

export function ReceiptVoucherTable({
  vouchers,
  isLoading = false,
  onView,
}: ReceiptVoucherTableProps) {
  const columns = useMemo<TableColumn<ReceiptVoucher>[]>(
    () => [
      {
        key: 'voucherNumber',
        header: 'Voucher #',
        render: (voucher) => (
          <span className={styles.voucherNumber}>{voucher.voucherNumber}</span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (voucher) => voucher.customer?.name ?? '—',
      },
      {
        key: 'invoice',
        header: 'Invoice',
        render: (voucher) => (
          <span className={styles.cellMuted}>
            {voucher.invoice?.invoiceNumber ?? '—'}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Payment Method',
        render: (voucher) => (
          <span className={styles.cellMuted}>
            {voucher.paymentMethod?.name ?? '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Receipt Date',
        render: (voucher) => (
          <div className={styles.creationCell}>
            <span>{formatReceiptVoucherDate(voucher.createdAt)}</span>
            <span className={styles.cellMuted}>
              {voucher.createdBy?.username ?? '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (voucher) => (
          <span className={styles.amount}>
            {formatReceiptVoucherMoney(voucher.amount)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (voucher) => (
          <ActionIconButton
            variant="view"
            label={`View receipt voucher ${voucher.voucherNumber}`}
            onClick={() => onView(voucher)}
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
      data={vouchers}
      columns={columns}
      rowKey={(voucher) => String(voucher.id)}
      isLoading={isLoading}
      loadingMessage="Loading receipt vouchers..."
      emptyMessage="No receipt vouchers yet. Record a receipt from Accounts Receivable."
    />
  )
}
