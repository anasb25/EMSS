import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Printer } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchInvoice } from '@/api/invoices'
import { JobCardDetailsModal } from '@/components/job-cards/JobCardDetailsModal'
import { InvoicePrintTemplate } from '@/components/invoices/InvoicePrintTemplate'
import { InvoiceView } from '@/components/invoices/InvoiceView'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import type { Invoice } from '@/types/invoice'
import styles from './InvoiceViewPage.module.css'

export function InvoiceViewPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobCardModalOpen, setJobCardModalOpen] = useState(false)

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
    navigate(ROUTES.invoices)
  }

  function handlePrint() {
    window.print()
  }

  function handleEdit() {
    if (!invoiceId) return
    navigate(ROUTES.invoiceEdit.replace(':invoiceId', invoiceId))
  }

  const canEditWorkflow =
    invoice?.jobCard && invoice.receivable?.status !== 'paid'

  return (
    <ModulePage
      title="Invoice"
      description="View invoice details, customer information, and product pricing."
      actions={
        <div className={styles.actions}>
          {invoice && canEditWorkflow ? (
            <Button type="button" variant="secondary" onClick={handleEdit}>
              <Pencil size={16} />
              Edit
            </Button>
          ) : null}
          {invoice ? (
            <Button type="button" variant="secondary" onClick={handlePrint}>
              <Printer size={16} />
              Print
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={handleBack}>
            <ArrowLeft size={16} />
            Back to Invoices
          </Button>
        </div>
      }
    >
      <div className={styles.screenContent}>
      {isLoading ? (
        <p className={styles.status}>Loading invoice…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : invoice ? (
        <>
          <InvoiceView
            invoice={invoice}
            onViewJobCard={
              invoice.jobCard ? () => setJobCardModalOpen(true) : undefined
            }
          />
          {invoice.jobCard ? (
            <JobCardDetailsModal
              jobCard={invoice.jobCard}
              isOpen={jobCardModalOpen}
              onClose={() => setJobCardModalOpen(false)}
              onEdit={() => setJobCardModalOpen(false)}
              readOnly
            />
          ) : null}
        </>
      ) : null}
      </div>

      {invoice ? <InvoicePrintTemplate invoice={invoice} /> : null}
    </ModulePage>
  )
}
