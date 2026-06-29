import type { Customer } from '@/types/customer'

export type CustomerLedgerEntryType = 'invoice' | 'manual_receivable' | 'payment'

export type CustomerLedgerEntryStatus = 'paid' | 'unpaid'

export type CustomerLedgerStatusFilter = 'all' | 'unpaid' | 'paid'

export type CustomerLedgerTypeFilter =
  | 'all'
  | 'invoice'
  | 'manual_receivable'
  | 'payment'

export interface CustomerLedgerEntry {
  id: string
  date: string
  type: CustomerLedgerEntryType
  reference: string
  description: string
  debit: number | null
  credit: number | null
  runningBalance: number
  status: CustomerLedgerEntryStatus
  receivableId: number | null
  invoiceId: string | null
  receiptVoucherId: number | null
  dueDate: string | null
  isOverdue: boolean
}

export interface CustomerLedgerSummary {
  openingBalance: number
  totalCharges: number
  totalPayments: number
  closingBalance: number
  overdueAmount: number
  unpaidCount: number
  paidCount: number
}

export interface CustomerLedger {
  customer: Customer
  summary: CustomerLedgerSummary
  entries: CustomerLedgerEntry[]
}

export interface CustomerLedgerListItem {
  customerId: string
  customerName: string
  email: string | null
  isActive: boolean
  outstanding: number
  totalPaid: number
  unpaidCount: number
  lastActivity: string | null
}

export type CustomerLedgerListStatusFilter =
  | 'all'
  | 'active'
  | 'inactive'
  | 'with_balance'

export function formatLedgerMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatLedgerDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function ledgerEntryTypeLabel(type: CustomerLedgerEntryType): string {
  switch (type) {
    case 'invoice':
      return 'Invoice'
    case 'manual_receivable':
      return 'Receivable'
    case 'payment':
      return 'Payment'
    default:
      return type
  }
}

export function ledgerStatusFilterLabel(status: CustomerLedgerStatusFilter): string {
  switch (status) {
    case 'unpaid':
      return 'Unpaid'
    case 'paid':
      return 'Paid'
    default:
      return 'All'
  }
}

export function ledgerTypeFilterLabel(type: CustomerLedgerTypeFilter): string {
  switch (type) {
    case 'invoice':
      return 'Invoices'
    case 'manual_receivable':
      return 'Receivables'
    case 'payment':
      return 'Payments'
    default:
      return 'All types'
  }
}

export function customerLedgerPath(customerId: string): string {
  return `/customers/${customerId}/ledger`
}
