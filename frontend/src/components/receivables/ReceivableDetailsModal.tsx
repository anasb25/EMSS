import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  formatReceivableDate,
  formatReceivableMoney,
  type Receivable,
} from '@/types/receivable'
import styles from './ReceivableDetailsModal.module.css'

interface ReceivableDetailsModalProps {
  receivable: Receivable | null
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

export function ReceivableDetailsModal({
  receivable,
  isOpen,
  onClose,
}: ReceivableDetailsModalProps) {
  if (!receivable) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      title={`Receivable #${receivable.id}`}
      description="Customer receivable details and payment information."
      onClose={onClose}
      size="md"
    >
      <div className={styles.content}>
        <div className={styles.summary}>
          <div className={styles.summaryTop}>
            <strong>{formatReceivableMoney(receivable.amount)}</strong>
            <Badge variant={receivable.status === 'paid' ? 'success' : 'neutral'}>
              {receivable.status === 'paid' ? 'Paid' : 'Unpaid'}
            </Badge>
          </div>
          <span>{receivable.customer?.name ?? 'Unknown customer'}</span>
        </div>

        <div className={styles.details}>
          <DetailRow label="ID" value={`#${receivable.id}`} />
          <DetailRow
            label="Customer"
            value={receivable.customer?.name ?? '—'}
          />
          <DetailRow
            label="Invoice"
            value={receivable.invoice?.invoiceNumber ?? '—'}
          />
          <DetailRow
            label="Due Date"
            value={receivable.dueDate ? formatReceivableDate(receivable.dueDate) : '—'}
          />
          <DetailRow
            label="Payment Method"
            value={receivable.paymentMethod?.name ?? '—'}
          />
          <DetailRow
            label="Creation"
            value={formatReceivableDate(receivable.createdAt)}
          />
          <DetailRow
            label="Created By"
            value={receivable.createdBy?.username ?? '—'}
          />
          {receivable.paidAt ? (
            <DetailRow
              label="Paid At"
              value={formatReceivableDate(receivable.paidAt)}
            />
          ) : null}
          {receivable.receiptVoucher ? (
            <DetailRow
              label="Receipt Voucher"
              value={receivable.receiptVoucher.voucherNumber}
            />
          ) : null}
          <DetailRow label="Bank Detail" value={receivable.bankDetail ?? '—'} />
          <DetailRow
            label="Cheque Number"
            value={receivable.chequeNumber ?? '—'}
          />
          <DetailRow
            label="Cheque Date"
            value={
              receivable.chequeDate
                ? formatReceivableDate(receivable.chequeDate)
                : '—'
            }
          />
          <DetailRow
            label="Transaction Reference"
            value={receivable.transactionReference ?? '—'}
          />
          <DetailRow label="Notes" value={receivable.notes ?? '—'} />
        </div>
      </div>
    </Modal>
  )
}
