import type { Customer } from '@/types/customer'
import type { PaymentMethod, ReceivableInvoice } from '@/types/receivable'

export interface SalesEntryCreator {
  id: string
  username: string
}

export interface SalesEntryReceiptVoucher {
  id: number
  voucherNumber: string
}

export interface SalesEntry {
  id: number
  saleDate: string
  receiptVoucherId: number
  receiptVoucher?: SalesEntryReceiptVoucher
  receivableId: number
  customerId: string
  customer?: Customer
  invoiceId: string | null
  invoice?: ReceivableInvoice | null
  paymentMethodId: number
  paymentMethod?: PaymentMethod
  amount: number
  description: string
  createdById: string | null
  createdBy?: SalesEntryCreator | null
  createdAt: string
  updatedAt: string
}

export interface SalesDaySummary {
  date: string
  totalSales: number
  entryCount: number
  entries: SalesEntry[]
}

export interface SalesPeriodSummary {
  dateFrom?: string
  dateTo?: string
  todayTotal: number
  todayCount: number
  totalSales: number
  entryCount: number
  entries: SalesEntry[]
}

export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatSalesMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatSalesDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatSalesDateLong(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function shiftDate(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

export { shiftDate }
