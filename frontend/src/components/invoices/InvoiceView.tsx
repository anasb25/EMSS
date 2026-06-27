import { Building2, ClipboardList, Eye, FileText, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusIndicator } from '@/components/job-cards/StatusIndicator'
import { JOB_CARD_WORKFLOW_STEPS } from '@/types/job-card'
import {
  formatInvoiceDate,
  formatInvoiceDateShort,
  formatInvoiceMoney,
  type Invoice,
} from '@/types/invoice'
import styles from './InvoiceView.module.css'

interface InvoiceViewProps {
  invoice: Invoice
  onViewJobCard?: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <p className={styles.detailLabel}>{label}</p>
      <p className={styles.detailValue}>{value}</p>
    </div>
  )
}

export function InvoiceView({ invoice, onViewJobCard }: InvoiceViewProps) {
  const customer = invoice.jobCard?.customer
  const jobCard = invoice.jobCard

  return (
    <div className={styles.invoiceView}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FileText size={24} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>{invoice.invoiceNumber}</h1>
            <p className={styles.headerSubtitle}>
              Invoice for {customer?.name ?? 'Customer'}
              {jobCard?.jobCardNumber ? ` · Job Card ${jobCard.jobCardNumber}` : ''}
            </p>
          </div>
        </div>
        <div className={styles.headerMeta}>
          <strong>Issued</strong>
          <span>{formatInvoiceDate(invoice.createdAt)}</span>
          {invoice.dueDate ? (
            <>
              <strong style={{ marginTop: '0.75rem' }}>Due Date</strong>
              <span>{formatInvoiceDateShort(invoice.dueDate)}</span>
            </>
          ) : null}
          {invoice.createdBy ? (
            <>
              <strong style={{ marginTop: '0.75rem' }}>Created by</strong>
              <span>{invoice.createdBy.username}</span>
            </>
          ) : null}
        </div>
      </header>

      <div className={styles.topGrid}>
        <section className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <h2 className={styles.infoCardTitle}>
              <User size={18} />
              Customer Information
            </h2>
          </div>
          <div className={styles.infoCardBody}>
            <DetailRow label="Name" value={customer?.name ?? '—'} />
            <DetailRow label="Email" value={customer?.email ?? '—'} />
            <DetailRow label="Phone" value={customer?.phoneNumber ?? '—'} />
            <DetailRow label="Mobile" value={customer?.mobileNumber ?? '—'} />
            <DetailRow label="TRN" value={customer?.trnNumber ?? '—'} />
            <DetailRow label="Country" value={customer?.country ?? '—'} />
            <DetailRow label="Address" value={customer?.address ?? '—'} />
          </div>
        </section>

        <section className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <h2 className={styles.infoCardTitle}>
              <ClipboardList size={18} />
              Job Card Details
            </h2>
            {onViewJobCard && jobCard ? (
              <Button type="button" variant="secondary" size="sm" onClick={onViewJobCard}>
                <Eye size={15} />
                View Job Card
              </Button>
            ) : null}
          </div>
          <div className={styles.infoCardBody}>
            <DetailRow label="Job Card #" value={jobCard?.jobCardNumber ?? '—'} />
            <DetailRow label="BL Number" value={jobCard?.blNumber ?? '—'} />
            <DetailRow
              label="Declaration"
              value={jobCard?.declarationNumber ?? '—'}
            />
            <DetailRow
              label="Container"
              value={jobCard?.containerNumber ?? '—'}
            />
            <DetailRow
              label="Status"
              value={jobCard?.isOpen ? 'Open' : 'Closed'}
            />
            {jobCard?.description ? (
              <DetailRow label="Description" value={jobCard.description} />
            ) : null}
            {jobCard ? (
              <div>
                <p className={styles.detailLabel}>Workflow</p>
                <div className={styles.workflowRow}>
                  {JOB_CARD_WORKFLOW_STEPS.map((step) => (
                    <span key={step.key} className={styles.workflowChip}>
                      <StatusIndicator value={jobCard[step.key]} />
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <h2 className={styles.productsTitle}>
            <Building2 size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Products & Pricing
          </h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.productsTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Note</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>VAT</th>
                <th>Subtotal</th>
                <th>VAT Amt</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={styles.productName}>
                      {item.productName || item.product?.name || 'Product'}
                    </span>
                  </td>
                  <td className={styles.noteCell}>{item.note || '—'}</td>
                  <td className={styles.numCell}>{item.quantity}</td>
                  <td className={styles.numCell}>{formatInvoiceMoney(item.unitPrice)}</td>
                  <td>
                    <span
                      className={`${styles.vatBadge} ${
                        item.includeVat ? styles.vatYes : styles.vatNo
                      }`}
                    >
                      {item.includeVat ? `${item.vatPercent}%` : 'No VAT'}
                    </span>
                  </td>
                  <td className={styles.numCell}>{formatInvoiceMoney(item.subtotal)}</td>
                  <td className={styles.numCell}>{formatInvoiceMoney(item.vatAmount)}</td>
                  <td className={styles.numCell}>{formatInvoiceMoney(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.totalsPanel}>
          <div className={styles.totalsGrid}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatInvoiceMoney(invoice.subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>VAT Total</span>
              <span>{formatInvoiceMoney(invoice.vatTotal)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
              <span>Grand Total</span>
              <span>{formatInvoiceMoney(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
