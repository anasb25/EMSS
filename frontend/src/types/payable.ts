import type { Vendor } from '@/types/vendor'

export interface PaymentMethod {
  id: number
  name: string
}

export interface PayableBill {
  id: string
  billNumber: string
  vendorReference: string | null
}

export interface PayableCreator {
  id: string
  username: string
}

export type PayableStatus = 'unpaid' | 'paid'

export interface Payable {
  id: number
  vendorId: string
  vendor?: Vendor
  paymentMethodId: number | null
  paymentMethod?: PaymentMethod | null
  billId: string | null
  bill?: PayableBill | null
  amount: number
  dueDate: string | null
  status: PayableStatus
  bankDetail: string | null
  chequeNumber: string | null
  chequeDate: string | null
  transactionReference: string | null
  notes: string | null
  createdById: string | null
  createdBy?: PayableCreator | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PayableFormData {
  vendorId: string
  amount: string
  dueDate: string
  notes: string
}

export interface RecordPaymentFormData {
  paymentMethodId: string
  bankDetail: string
  chequeNumber: string
  chequeDate: string
  transactionReference: string
  notes: string
}

export function emptyPayableForm(): PayableFormData {
  const due = new Date()
  due.setDate(due.getDate() + 30)

  return {
    vendorId: '',
    amount: '',
    dueDate: due.toISOString().slice(0, 10),
    notes: '',
  }
}

export function emptyRecordPaymentForm(): RecordPaymentFormData {
  return {
    paymentMethodId: '',
    bankDetail: '',
    chequeNumber: '',
    chequeDate: '',
    transactionReference: '',
    notes: '',
  }
}

export function formatPayableMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPayableDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
