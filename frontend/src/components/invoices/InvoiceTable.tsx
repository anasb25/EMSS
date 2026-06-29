import { useMemo } from 'react'
import { Eye, Pencil } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Table } from '@/components/ui/Table'
import {
  formatInvoiceDateShort,
  formatInvoiceMoney,
  type Invoice,
} from '@/types/invoice'
import type { TableColumn } from '@/types/table'
import styles from './InvoiceTable.module.css'

interface InvoiceTableProps {
  invoices: Invoice[]
  isLoading?: boolean
  onView: (invoice: Invoice) => void
  onEdit?: (invoice: Invoice) => void
}

export function InvoiceTable({
  invoices,
  isLoading = false,
  onView,
  onEdit,
}: InvoiceTableProps) {
  const columns = useMemo<TableColumn<Invoice>[]>(
    () => [
      {
        key: 'invoiceNumber',
        header: 'Invoice #',
        render: (invoice) => (
          <span className={styles.invoiceNumber}>{invoice.invoiceNumber}</span>
        ),
      },
      {
        key: 'jobCard',
        header: 'Job Card',
        render: (invoice) => invoice.jobCard?.jobCardNumber ?? '—',
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (invoice) => invoice.jobCard?.customer?.name ?? '—',
      },
      {
        key: 'createdAt',
        header: 'Issued',
        render: (invoice) => formatInvoiceDateShort(invoice.createdAt),
      },
      {
        key: 'grandTotal',
        header: 'Total',
        render: (invoice) => (
          <span className={styles.total}>{formatInvoiceMoney(invoice.grandTotal)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (invoice) => (
          <div className={styles.actions}>
            {onEdit && invoice.receivable?.status !== 'paid' && invoice.jobCard ? (
              <ActionIconButton
                label="Edit invoice workflow"
                variant="edit"
                onClick={() => onEdit(invoice)}
              >
                <Pencil size={15} />
              </ActionIconButton>
            ) : null}
            <ActionIconButton
              label="View invoice"
              variant="view"
              onClick={() => onView(invoice)}
            >
              <Eye size={15} />
            </ActionIconButton>
          </div>
        ),
      },
    ],
    [onEdit, onView],
  )

  return (
    <Table
      columns={columns}
      data={invoices}
      rowKey={(invoice) => invoice.id}
      isLoading={isLoading}
      loadingMessage="Loading invoices..."
      emptyMessage="No invoices found."
    />
  )
}
