import type { JobCard } from '@/types/job-card'
import type { Product } from '@/types/product'

export interface InvoiceCreator {
  id: string
  username: string
}

export interface InvoiceReceivableSummary {
  id: number
  status: 'unpaid' | 'paid'
}

export interface InvoiceLineItem {
  id: string
  productId: string
  product?: Product
  productName: string
  note: string | null
  quantity: number
  unitPrice: number
  includeVat: boolean
  vatPercent: number
  subtotal: number
  vatAmount: number
  lineTotal: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  jobCardId: string
  jobCard?: JobCard
  subtotal: number
  vatTotal: number
  grandTotal: number
  dueDate: string | null
  createdById: string | null
  createdBy?: InvoiceCreator | null
  receivable?: InvoiceReceivableSummary | null
  items: InvoiceLineItem[]
  createdAt: string
  updatedAt: string
}

export interface InvoiceWorkflowFormData {
  transport: boolean
  logistics: boolean
  isImport: boolean
  isExport: boolean
  freight: boolean
}

export interface InvoiceWorkflowUpdateResult {
  voided: boolean
  jobCardId: string
  jobCardNumber: string | null
  invoice?: Invoice
}

export function invoiceWorkflowFromJobCard(
  jobCard: NonNullable<Invoice['jobCard']>,
): InvoiceWorkflowFormData {
  return {
    transport: jobCard.transport,
    logistics: jobCard.logistics,
    isImport: jobCard.isImport,
    isExport: jobCard.isExport,
    freight: jobCard.freight,
  }
}

export function formatInvoiceMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatInvoiceDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatInvoiceDateShort(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatInvoicePrintDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function invoicePaymentTerms(invoice: Invoice): string {
  if (!invoice.dueDate) {
    return 'Payable immediately'
  }

  const invoiceDate = new Date(invoice.createdAt)
  const dueDate = new Date(invoice.dueDate)
  const diffDays = Math.ceil(
    (dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays <= 0) {
    return 'Payable immediately'
  }

  return `Due by ${formatInvoicePrintDate(invoice.dueDate)}`
}

export function invoiceDisplayValue(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '—'
  }

  return value.trim()
}
