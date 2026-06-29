import { type FormEvent, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  areAllWorkflowStepsComplete,
  JOB_CARD_WORKFLOW_STEPS,
  type JobCardWorkflowKey,
} from '@/types/job-card'
import type { Invoice, InvoiceWorkflowFormData } from '@/types/invoice'
import workflowStyles from '@/components/job-cards/JobCardEditForm.module.css'
import styles from './InvoiceWorkflowEditForm.module.css'

interface InvoiceWorkflowEditFormProps {
  invoice: Invoice
  onSubmit: (data: InvoiceWorkflowFormData) => Promise<void>
  onCancel: () => void
}

function workflowFromInvoice(invoice: Invoice): InvoiceWorkflowFormData {
  const jobCard = invoice.jobCard

  return {
    transport: jobCard?.transport ?? false,
    logistics: jobCard?.logistics ?? false,
    isImport: jobCard?.isImport ?? false,
    isExport: jobCard?.isExport ?? false,
    freight: jobCard?.freight ?? false,
  }
}

export function InvoiceWorkflowEditForm({
  invoice,
  onSubmit,
  onCancel,
}: InvoiceWorkflowEditFormProps) {
  const [form, setForm] = useState<InvoiceWorkflowFormData>(() =>
    workflowFromInvoice(invoice),
  )
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(workflowFromInvoice(invoice))
    setError('')
  }, [invoice])

  const allStepsComplete = areAllWorkflowStepsComplete(form)
  const willVoidInvoice = !allStepsComplete

  function markStepComplete(key: JobCardWorkflowKey) {
    setForm((current) => ({ ...current, [key]: true }))
  }

  function markStepIncomplete(key: JobCardWorkflowKey) {
    setForm((current) => ({ ...current, [key]: false }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to update invoice workflow.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.meta}>
        <div>
          <span className={styles.metaLabel}>Invoice</span>
          <strong>{invoice.invoiceNumber}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Job Card</span>
          <strong>{invoice.jobCard?.jobCardNumber ?? '—'}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Customer</span>
          <strong>{invoice.jobCard?.customer?.name ?? '—'}</strong>
        </div>
      </div>

      <p className={styles.helpText}>
        Update workflow steps for the linked job card. If any step is marked incomplete,
        the invoice will be removed and the job card will reopen for further work.
      </p>

      <section className={workflowStyles.workflowCard}>
        <h3 className={workflowStyles.cardTitle}>Workflow Steps</h3>
        <ul className={workflowStyles.workflowList}>
          {JOB_CARD_WORKFLOW_STEPS.map((step) => {
            const isComplete = form[step.key]

            return (
              <li
                key={step.key}
                className={[
                  workflowStyles.workflowItem,
                  isComplete ? workflowStyles.workflowItemComplete : '',
                ].join(' ')}
              >
                <div className={workflowStyles.workflowLeft}>
                  <span
                    className={[
                      workflowStyles.stepIcon,
                      isComplete
                        ? workflowStyles.stepIconComplete
                        : workflowStyles.stepIconPending,
                    ].join(' ')}
                  >
                    {isComplete ? (
                      <Check size={16} strokeWidth={2.5} />
                    ) : (
                      <X size={16} strokeWidth={2.5} />
                    )}
                  </span>
                  <span className={workflowStyles.stepLabel}>{step.label}</span>
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
      </section>

      {willVoidInvoice ? (
        <p className={styles.warning}>
          Saving with incomplete workflow steps will remove this invoice and return the
          job card to open status.
        </p>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {willVoidInvoice ? 'Save and Return to Job Card' : 'Save Workflow'}
        </Button>
      </div>
    </form>
  )
}
