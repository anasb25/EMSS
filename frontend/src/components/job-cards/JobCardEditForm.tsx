import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  areAllWorkflowStepsComplete,
  formatMoney,
  getJobCardGrandTotal,
  JOB_CARD_WORKFLOW_STEPS,
  jobCardToEditFormData,
  jobCardToLineItemDrafts,
  lineItemDraftsToFormItems,
  type JobCard,
  type JobCardEditFormData,
  type JobCardWorkflowKey,
} from '@/types/job-card'
import styles from './JobCardEditForm.module.css'

interface JobCardEditFormProps {
  jobCard: JobCard
  onSubmit: (data: JobCardEditFormData) => Promise<void>
  onGenerateInvoice: (data: JobCardEditFormData) => Promise<void>
  onCancel: () => void
}

export function JobCardEditForm({
  jobCard,
  onSubmit,
  onGenerateInvoice,
  onCancel,
}: JobCardEditFormProps) {
  const [form, setForm] = useState<JobCardEditFormData>(() => jobCardToEditFormData(jobCard))
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)

  useEffect(() => {
    setForm(jobCardToEditFormData(jobCard))
    setError('')
  }, [jobCard])

  const lineItems = useMemo(() => jobCardToLineItemDrafts(jobCard), [jobCard])
  const grandTotal = useMemo(() => getJobCardGrandTotal(jobCard), [jobCard])
  const allStepsComplete = areAllWorkflowStepsComplete(form)

  function buildPayload(isClosed: boolean): JobCardEditFormData {
    return {
      ...form,
      items: lineItemDraftsToFormItems(lineItems),
      isOpen: !isClosed,
    }
  }

  function markStepComplete(key: JobCardWorkflowKey) {
    setForm((current) => {
      const next = { ...current, [key]: true }
      if (areAllWorkflowStepsComplete(next)) {
        next.isOpen = false
      }
      return next
    })
  }

  function markStepIncomplete(key: JobCardWorkflowKey) {
    setForm((current) => ({
      ...current,
      [key]: false,
      isOpen: true,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    setIsSubmitting(true)
    try {
      await onSubmit(buildPayload(allStepsComplete))
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to update job card.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGenerateInvoice() {
    if (!allStepsComplete) return

    setError('')
    setIsGeneratingInvoice(true)
    try {
      await onGenerateInvoice(buildPayload(true))
    } catch (invoiceError) {
      setError(
        invoiceError instanceof Error
          ? invoiceError.message
          : 'Unable to generate invoice.',
      )
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.topGrid}>
        <section className={styles.detailsCard}>
          <h3 className={styles.cardTitle}>Job Card Details</h3>
          <dl className={styles.detailsList}>
            <div className={styles.fullRow}>
              <dt>Job Card ID</dt>
              <dd className={styles.jobCardId}>{jobCard.jobCardNumber ?? '—'}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{jobCard.customer?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{jobCard.customer?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>BL Number</dt>
              <dd>{jobCard.blNumber || '—'}</dd>
            </div>
            <div>
              <dt>Declaration Number</dt>
              <dd>{jobCard.declarationNumber || '—'}</dd>
            </div>
            <div>
              <dt>Container Number</dt>
              <dd>{jobCard.containerNumber || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <Badge variant={form.isOpen ? 'success' : 'danger'}>
                  {form.isOpen ? 'Open' : 'Closed'}
                </Badge>
              </dd>
            </div>
            {jobCard.description ? (
              <div className={styles.fullRow}>
                <dt>Description</dt>
                <dd>{jobCard.description}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className={styles.workflowCard}>
          <h3 className={styles.cardTitle}>Workflow Steps</h3>
          <ul className={styles.workflowList}>
            {JOB_CARD_WORKFLOW_STEPS.map((step) => {
              const isComplete = form[step.key]

              return (
                <li
                  key={step.key}
                  className={[
                    styles.workflowItem,
                    isComplete ? styles.workflowItemComplete : '',
                  ].join(' ')}
                >
                  <div className={styles.workflowLeft}>
                    <span
                      className={[
                        styles.stepIcon,
                        isComplete ? styles.stepIconComplete : styles.stepIconPending,
                      ].join(' ')}
                    >
                      {isComplete ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        <X size={16} strokeWidth={2.5} />
                      )}
                    </span>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </div>
                  {!isComplete ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => markStepComplete(step.key)}
                    >
                      Mark as Complete
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => markStepIncomplete(step.key)}
                    >
                      Mark as Incomplete
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>

          {allStepsComplete ? (
            <div className={styles.generateInvoiceSection}>
              <p className={styles.generateInvoiceHint}>
                All workflow steps are complete. You can now generate an invoice for this
                job card.
              </p>
              <Button
                type="button"
                onClick={handleGenerateInvoice}
                isLoading={isGeneratingInvoice}
                disabled={isSubmitting}
              >
                <FileText size={16} />
                Generate Invoice
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <section className={styles.productsSection}>
        <h3 className={styles.sectionTitle}>Products</h3>
        <div className={styles.lineItemsTableWrap}>
          <table className={styles.lineItemsTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Note</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Include VAT</th>
                <th>VAT %</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.key}>
                  <td className={styles.productNameCell}>{item.productName}</td>
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
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isGeneratingInvoice}>
          Update Job Card
        </Button>
      </div>
    </form>
  )
}
