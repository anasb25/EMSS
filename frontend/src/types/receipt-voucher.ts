import type { Customer } from '@/types/customer'
import type { PaymentMethod, ReceivableInvoice } from '@/types/receivable'

export interface ReceiptVoucherCreator {
  id: string
  username: string
}

export interface ReceiptVoucher {
  id: number
  voucherNumber: string
  receivableId: number
  customerId: string
  customer?: Customer
  invoiceId: string | null
  invoice?: ReceivableInvoice | null
  amount: number
  paymentMethodId: number
  paymentMethod?: PaymentMethod
  bankDetail: string | null
  chequeNumber: string | null
  chequeDate: string | null
  transactionReference: string | null
  notes: string | null
  createdById: string | null
  createdBy?: ReceiptVoucherCreator | null
  createdAt: string
  updatedAt: string
}

export function formatReceiptVoucherMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatReceiptVoucherDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatReceiptVoucherDateLong(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
