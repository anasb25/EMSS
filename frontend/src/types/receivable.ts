import type { Customer } from '@/types/customer'

export interface PaymentMethod {
  id: number
  name: string
}

export interface ReceivableInvoice {
  id: string
  invoiceNumber: string
}

export interface ReceivableCreator {
  id: string
  username: string
}

export interface ReceivableReceiptVoucher {
  id: number
  voucherNumber: string
}

export type ReceivableStatus = 'unpaid' | 'paid'

export interface Receivable {
  id: number
  customerId: string
  customer?: Customer
  paymentMethodId: number | null
  paymentMethod?: PaymentMethod | null
  invoiceId: string | null
  invoice?: ReceivableInvoice | null
  amount: number
  dueDate: string | null
  status: ReceivableStatus
  bankDetail: string | null
  chequeNumber: string | null
  chequeDate: string | null
  transactionReference: string | null
  notes: string | null
  createdById: string | null
  createdBy?: ReceivableCreator | null
  paidAt: string | null
  receiptVoucher?: ReceivableReceiptVoucher | null
  createdAt: string
  updatedAt: string
}

export interface ReceivableFormData {
  customerId: string
  amount: string
  dueDate: string
  paymentMethodId: string
  bankDetail: string
  chequeNumber: string
  chequeDate: string
  transactionReference: string
  notes: string
}

export interface RecordReceiptFormData {
  paymentMethodId: string
  bankDetail: string
  chequeNumber: string
  chequeDate: string
  transactionReference: string
  notes: string
}

export function emptyReceivableForm(): ReceivableFormData {
  const due = new Date()
  due.setDate(due.getDate() + 30)

  return {
    customerId: '',
    amount: '',
    dueDate: due.toISOString().slice(0, 10),
    paymentMethodId: '',
    bankDetail: '',
    chequeNumber: '',
    chequeDate: '',
    transactionReference: '',
    notes: '',
  }
}

export function emptyRecordReceiptForm(): RecordReceiptFormData {
  return {
    paymentMethodId: '',
    bankDetail: '',
    chequeNumber: '',
    chequeDate: '',
    transactionReference: '',
    notes: '',
  }
}

export function formatReceivableMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatReceivableDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
