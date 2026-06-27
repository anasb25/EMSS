import { ClipboardList, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatusIndicator } from '@/components/job-cards/StatusIndicator'
import { Modal } from '@/components/ui/Modal'
import {
  formatMoney,
  getJobCardGrandTotal,
  JOB_CARD_WORKFLOW_STEPS,
  type JobCard,
} from '@/types/job-card'
import styles from './JobCardDetailsModal.module.css'

interface JobCardDetailsModalProps {
  jobCard: JobCard | null
  isOpen: boolean
  onClose: () => void
  onEdit: (jobCard: JobCard) => void
  readOnly?: boolean
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <p className={styles.detailLabel}>{label}</p>
      <p className={styles.detailValue}>{value}</p>
    </div>
  )
}

export function JobCardDetailsModal({
  jobCard,
  isOpen,
  onClose,
  onEdit,
  readOnly = false,
}: JobCardDetailsModalProps) {
  if (!jobCard) return null

  const selectedJobCard = jobCard
  const grandTotal = getJobCardGrandTotal(selectedJobCard)

  function handleEdit() {
    onClose()
    onEdit(selectedJobCard)
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Job Card Details"
      description="Customer, shipment details, and product pricing."
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {!readOnly ? (
            <Button type="button" onClick={handleEdit}>
              <Pencil size={15} />
              Edit Job Card
            </Button>
          ) : null}
        </>
      }
    >
      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <ClipboardList size={22} />
          </div>
          <div>
            <h3 className={styles.title}>{selectedJobCard.customer?.name ?? 'Customer'}</h3>
            <p className={styles.jobCardId}>{selectedJobCard.jobCardNumber ?? '—'}</p>
            <p className={styles.subtitle}>
              {selectedJobCard.items.length} product
              {selectedJobCard.items.length === 1 ? '' : 's'} · Total{' '}
              {formatMoney(grandTotal)} ·{' '}
              <Badge variant={selectedJobCard.isOpen ? 'success' : 'danger'}>
                {selectedJobCard.isOpen ? 'Open' : 'Closed'}
              </Badge>
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Workflow</h4>
          <div className={styles.workflowGrid}>
            {JOB_CARD_WORKFLOW_STEPS.map((step) => (
              <div key={step.key} className={styles.workflowChip}>
                <StatusIndicator value={selectedJobCard[step.key]} />
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Shipment Details</h4>
          <div className={styles.detailGrid}>
            <DetailItem label="BL Number" value={selectedJobCard.blNumber || '—'} />
            <DetailItem
              label="Declaration Number"
              value={selectedJobCard.declarationNumber || '—'}
            />
            <DetailItem
              label="Container Number"
              value={selectedJobCard.containerNumber || '—'}
            />
          </div>
          {selectedJobCard.description ? (
            <div className={styles.descriptionBox}>
              <p className={styles.detailLabel}>Description</p>
              <p className={styles.descriptionText}>{selectedJobCard.description}</p>
            </div>
          ) : null}
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Products & Pricing</h4>
          <div className={styles.lineItemsTableWrap}>
            <table className={styles.lineItemsTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Note</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>VAT</th>
                  <th>VAT %</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedJobCard.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name ?? 'Product'}</td>
                    <td>{item.note || '—'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatMoney(item.unitPrice)}</td>
                    <td>{item.includeVat ? 'Yes' : 'No'}</td>
                    <td>{item.vatPercent}%</td>
                    <td className={styles.totalCell}>{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className={styles.grandTotalLabel}>
                    Grand Total
                  </td>
                  <td className={styles.grandTotalValue}>{formatMoney(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  )
}
