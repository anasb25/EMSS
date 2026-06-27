import { Modal } from '@/components/ui/Modal'
import {
  formatReceiptVoucherDate,
  formatReceiptVoucherDateLong,
  formatReceiptVoucherMoney,
  type ReceiptVoucher,
} from '@/types/receipt-voucher'
import styles from './ReceiptVoucherDetailsModal.module.css'

interface ReceiptVoucherDetailsModalProps {
  voucher: ReceiptVoucher | null
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

export function ReceiptVoucherDetailsModal({
  voucher,
  isOpen,
  onClose,
}: ReceiptVoucherDetailsModalProps) {
  if (!voucher) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      title={voucher.voucherNumber}
      description="Receipt voucher details for customer payment."
      onClose={onClose}
      size="md"
    >
      <div className={styles.content}>
        <div className={styles.summary}>
          <strong>{formatReceiptVoucherMoney(voucher.amount)}</strong>
          <span>{voucher.customer?.name ?? 'Unknown customer'}</span>
        </div>

        <div className={styles.details}>
          <DetailRow label="Voucher #" value={voucher.voucherNumber} />
          <DetailRow label="Receivable ID" value={`#${voucher.receivableId}`} />
          <DetailRow label="Customer" value={voucher.customer?.name ?? '—'} />
          <DetailRow
            label="Invoice"
            value={voucher.invoice?.invoiceNumber ?? '—'}
          />
          <DetailRow
            label="Payment Method"
            value={voucher.paymentMethod?.name ?? '—'}
          />
          <DetailRow
            label="Receipt Date"
            value={formatReceiptVoucherDateLong(voucher.createdAt)}
          />
          <DetailRow
            label="Created By"
            value={voucher.createdBy?.username ?? '—'}
          />
          <DetailRow label="Bank Detail" value={voucher.bankDetail ?? '—'} />
          <DetailRow
            label="Cheque Number"
            value={voucher.chequeNumber ?? '—'}
          />
          <DetailRow
            label="Cheque Date"
            value={
              voucher.chequeDate
                ? formatReceiptVoucherDate(voucher.chequeDate)
                : '—'
            }
          />
          <DetailRow
            label="Transaction Reference"
            value={voucher.transactionReference ?? '—'}
          />
          <DetailRow label="Notes" value={voucher.notes ?? '—'} />
        </div>
      </div>
    </Modal>
  )
}
