import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchInvoice, updateInvoiceWorkflow } from '@/api/invoices'
import { InvoiceWorkflowEditForm } from '@/components/invoices/InvoiceWorkflowEditForm'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/config/routes'
import type { Invoice, InvoiceWorkflowFormData } from '@/types/invoice'
import styles from './InvoiceEditPage.module.css'

export function InvoiceEditPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return

    setIsLoading(true)
    setError('')

    try {
      const data = await fetchInvoice(invoiceId)
      setInvoice(data)
    } catch {
      setError('Failed to load invoice.')
      setInvoice(null)
    } finally {
      setIsLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    void loadInvoice()
  }, [loadInvoice])

  function handleBack() {
    if (invoiceId) {
      navigate(ROUTES.invoiceDetail.replace(':invoiceId', invoiceId))
      return
    }

    navigate(ROUTES.invoices)
  }

  async function handleSubmit(data: InvoiceWorkflowFormData) {
    if (!invoiceId) return

    const result = await updateInvoiceWorkflow(invoiceId, data)

    if (result.voided) {
      navigate(ROUTES.jobCards, {
        replace: true,
        state: {
          notice: `Invoice removed. Job card ${result.jobCardNumber ?? ''} is open again.`,
        },
      })
      return
    }

    navigate(ROUTES.invoiceDetail.replace(':invoiceId', invoiceId), { replace: true })
  }

  const isPaid = invoice?.receivable?.status === 'paid'

  return (
    <ModulePage
      title="Edit Invoice"
      description="Manage job card workflow steps linked to this invoice."
      actions={
        <Button type="button" variant="secondary" onClick={handleBack}>
          <ArrowLeft size={16} />
          Back
        </Button>
      }
    >
      {isLoading ? (
        <p className={styles.status}>Loading invoice…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : invoice ? (
        isPaid ? (
          <Card className={styles.blockedCard}>
            <h2 className={styles.blockedTitle}>Editing not available</h2>
            <p className={styles.blockedText}>
              This invoice has already been paid. Workflow steps cannot be changed after
              payment is recorded.
            </p>
            <Button type="button" variant="secondary" onClick={handleBack}>
              Back to Invoice
            </Button>
          </Card>
        ) : !invoice.jobCard ? (
          <Card className={styles.blockedCard}>
            <h2 className={styles.blockedTitle}>No linked job card</h2>
            <p className={styles.blockedText}>
              This invoice is not linked to a job card, so workflow steps cannot be edited.
            </p>
            <Button type="button" variant="secondary" onClick={handleBack}>
              Back to Invoice
            </Button>
          </Card>
        ) : (
          <Card className={styles.formCard}>
            <InvoiceWorkflowEditForm
              invoice={invoice}
              onSubmit={handleSubmit}
              onCancel={handleBack}
            />
          </Card>
        )
      ) : null}
    </ModulePage>
  )
}
