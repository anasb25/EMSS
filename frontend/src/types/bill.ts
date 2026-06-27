import type { Vendor } from '@/types/vendor'

export interface BillCreator {
  id: string
  username: string
}

export interface BillLineItem {
  id: string
  description: string
  note: string | null
  quantity: number
  unitPrice: number
  includeVat: boolean
  vatPercent: number
  subtotal: number
  vatAmount: number
  lineTotal: number
}

export interface Bill {
  id: string
  billNumber: string
  vendorId: string
  vendor?: Vendor
  vendorReference: string | null
  billDate: string
  dueDate: string
  subtotal: number
  vatTotal: number
  grandTotal: number
  notes: string | null
  createdById: string | null
  createdBy?: BillCreator | null
  items: BillLineItem[]
  createdAt: string
  updatedAt: string
}

export interface BillFormItem {
  description: string
  note: string
  quantity: number
  unitPrice: number
  includeVat: boolean
  vatPercent: number
}

export interface BillFormData {
  vendorId: string
  vendorReference: string
  billDate: string
  dueDate: string
  notes: string
  items: BillFormItem[]
}

export interface BillLineItemDraft extends BillFormItem {
  key: string
  subtotal: number
  vatAmount: number
  lineTotal: number
}

export function emptyBillForm(): BillFormData {
  const today = new Date().toISOString().slice(0, 10)
  const due = new Date()
  due.setDate(due.getDate() + 30)

  return {
    vendorId: '',
    vendorReference: '',
    billDate: today,
    dueDate: due.toISOString().slice(0, 10),
    notes: '',
    items: [],
  }
}

export function createLineItemDraft(
  partial: Partial<BillFormItem> = {},
): BillLineItemDraft {
  const item: BillFormItem = {
    description: partial.description ?? '',
    note: partial.note ?? '',
    quantity: partial.quantity ?? 1,
    unitPrice: partial.unitPrice ?? 0,
    includeVat: partial.includeVat ?? false,
    vatPercent: partial.vatPercent ?? 5,
  }

  const pricing = calculateBillLinePricing(
    item.quantity,
    item.unitPrice,
    item.includeVat,
    item.vatPercent,
  )

  return {
    key: crypto.randomUUID(),
    ...item,
    ...pricing,
  }
}

export function calculateBillLinePricing(
  quantity: number,
  unitPrice: number,
  includeVat: boolean,
  vatPercent = 5,
) {
  const subtotal = roundMoney(quantity * unitPrice)
  const vatAmount = includeVat ? roundMoney(subtotal * (vatPercent / 100)) : 0
  const lineTotal = roundMoney(subtotal + vatAmount)
  return { subtotal, vatAmount, lineTotal }
}

export function recalculateLineItemDraft(
  draft: BillLineItemDraft,
  updates: Partial<BillFormItem>,
): BillLineItemDraft {
  const next = { ...draft, ...updates }
  const pricing = calculateBillLinePricing(
    next.quantity,
    next.unitPrice,
    next.includeVat,
    next.vatPercent,
  )
  return { ...next, ...pricing }
}

export function lineItemDraftsToFormItems(
  drafts: BillLineItemDraft[],
): BillFormItem[] {
  return drafts.map(({ description, note, quantity, unitPrice, includeVat, vatPercent }) => ({
    description,
    note,
    quantity,
    unitPrice,
    includeVat,
    vatPercent,
  }))
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function formatBillMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatBillDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatBillDateLong(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
