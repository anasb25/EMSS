import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  formatPayableDate,
  formatPayableMoney,
  type Payable,
} from '@/types/payable'
import styles from './PayableDetailsModal.module.css'

interface PayableDetailsModalProps {
  payable: Payable | null
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

export function PayableDetailsModal({
  payable,
  isOpen,
  onClose,
}: PayableDetailsModalProps) {
  if (!payable) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      title={`Payable #${payable.id}`}
      description="Vendor payable details and payment information."
      onClose={onClose}
      size="md"
    >
      <div className={styles.content}>
        <div className={styles.summary}>
          <div className={styles.summaryTop}>
            <strong>{formatPayableMoney(payable.amount)}</strong>
            <Badge variant={payable.status === 'paid' ? 'success' : 'neutral'}>
              {payable.status === 'paid' ? 'Paid' : 'Unpaid'}
            </Badge>
          </div>
          <span>{payable.vendor?.name ?? 'Unknown vendor'}</span>
        </div>

        <div className={styles.details}>
          <DetailRow label="ID" value={`#${payable.id}`} />
          <DetailRow label="Vendor" value={payable.vendor?.name ?? '—'} />
          <DetailRow
            label="Bill"
            value={payable.bill?.billNumber ?? '—'}
          />
          <DetailRow
            label="Vendor Reference"
            value={payable.bill?.vendorReference ?? '—'}
          />
          <DetailRow
            label="Payment Method"
            value={payable.paymentMethod?.name ?? '—'}
          />
          <DetailRow
            label="Due Date"
            value={payable.dueDate ? formatPayableDate(payable.dueDate) : '—'}
          />
          <DetailRow
            label="Creation"
            value={formatPayableDate(payable.createdAt)}
          />
          <DetailRow
            label="Created By"
            value={payable.createdBy?.username ?? '—'}
          />
          {payable.paidAt ? (
            <DetailRow
              label="Paid At"
              value={formatPayableDate(payable.paidAt)}
            />
          ) : null}
          <DetailRow label="Bank Detail" value={payable.bankDetail ?? '—'} />
          <DetailRow
            label="Cheque Number"
            value={payable.chequeNumber ?? '—'}
          />
          <DetailRow
            label="Cheque Date"
            value={
              payable.chequeDate
                ? formatPayableDate(payable.chequeDate)
                : '—'
            }
          />
          <DetailRow
            label="Transaction Reference"
            value={payable.transactionReference ?? '—'}
          />
          <DetailRow label="Notes" value={payable.notes ?? '—'} />
        </div>
      </div>
    </Modal>
  )
}
