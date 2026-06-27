import type { Customer } from '@/types/customer'
import type { Product } from '@/types/product'
import { calculateLinePricing } from '@/utils/job-card-pricing'

export interface JobCardLineItem {
  id: string
  productId: string
  product?: Product
  note: string | null
  quantity: number
  unitPrice: number
  includeVat: boolean
  vatPercent: number
  subtotal: number
  vatAmount: number
  lineTotal: number
}

export interface JobCardCreator {
  id: string
  username: string
}

export interface JobCard {
  id: string
  jobCardNumber: string | null
  customerId: string
  customer?: Customer
  blNumber: string | null
  declarationNumber: string | null
  containerNumber: string | null
  description: string | null
  isOpen: boolean
  transport: boolean
  logistics: boolean
  isImport: boolean
  isExport: boolean
  freight: boolean
  createdById: string | null
  createdBy?: JobCardCreator | null
  items: JobCardLineItem[]
  createdAt: string
  updatedAt: string
}

export type JobCardWorkflowKey =
  | 'transport'
  | 'logistics'
  | 'isImport'
  | 'isExport'
  | 'freight'

export const JOB_CARD_WORKFLOW_STEPS: {
  key: JobCardWorkflowKey
  label: string
}[] = [
  { key: 'transport', label: 'Transport' },
  { key: 'logistics', label: 'Logistics' },
  { key: 'isImport', label: 'Import' },
  { key: 'isExport', label: 'Export' },
  { key: 'freight', label: 'Freight' },
]

export interface JobCardFormItem {
  productId: string
  note: string
  quantity: number
  unitPrice: number
  includeVat: boolean
}

export interface JobCardFormData {
  customerId: string
  blNumber: string
  declarationNumber: string
  containerNumber: string
  description: string
  items: JobCardFormItem[]
}

export interface JobCardEditFormData extends JobCardFormData {
  isOpen: boolean
  transport: boolean
  logistics: boolean
  isImport: boolean
  isExport: boolean
  freight: boolean
}

export interface JobCardLineItemDraft {
  key: string
  productId: string
  productName: string
  note: string
  quantity: number
  unitPrice: number
  includeVat: boolean
  vatPercent: number
  subtotal: number
  vatAmount: number
  lineTotal: number
}

export const emptyJobCardForm = (): JobCardFormData => ({
  customerId: '',
  blNumber: '',
  declarationNumber: '',
  containerNumber: '',
  description: '',
  items: [],
})

export function jobCardToEditFormData(jobCard: JobCard): JobCardEditFormData {
  return {
    ...jobCardToFormData(jobCard),
    isOpen: jobCard.isOpen,
    transport: jobCard.transport,
    logistics: jobCard.logistics,
    isImport: jobCard.isImport,
    isExport: jobCard.isExport,
    freight: jobCard.freight,
  }
}

export function areAllWorkflowStepsComplete(data: Pick<
  JobCardEditFormData,
  'transport' | 'logistics' | 'isImport' | 'isExport' | 'freight'
>): boolean {
  return (
    data.transport &&
    data.logistics &&
    data.isImport &&
    data.isExport &&
    data.freight
  )
}

export function jobCardToFormData(jobCard: JobCard): JobCardFormData {
  return {
    customerId: jobCard.customerId,
    blNumber: jobCard.blNumber ?? '',
    declarationNumber: jobCard.declarationNumber ?? '',
    containerNumber: jobCard.containerNumber ?? '',
    description: jobCard.description ?? '',
    items: jobCard.items.map((item) => ({
      productId: item.productId,
      note: item.note ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      includeVat: item.includeVat,
    })),
  }
}

export function jobCardToLineItemDrafts(jobCard: JobCard): JobCardLineItemDraft[] {
  return jobCard.items.map((item) => ({
    key: item.id,
    productId: item.productId,
    productName: item.product?.name ?? 'Product',
    note: item.note ?? '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    includeVat: item.includeVat,
    vatPercent: item.vatPercent,
    subtotal: item.subtotal,
    vatAmount: item.vatAmount,
    lineTotal: item.lineTotal,
  }))
}

export function createLineItemDraft(
  productId: string,
  productName: string,
): JobCardLineItemDraft {
  const pricing = calculateLinePricing(1, 0, false)

  return {
    key: crypto.randomUUID(),
    productId,
    productName,
    note: '',
    quantity: 1,
    unitPrice: 0,
    includeVat: false,
    subtotal: pricing.subtotal,
    vatAmount: pricing.vatAmount,
    lineTotal: pricing.lineTotal,
    vatPercent: pricing.vatPercent,
  }
}

export function recalculateLineItemDraft(
  item: JobCardLineItemDraft,
): JobCardLineItemDraft {
  const pricing = calculateLinePricing(
    item.quantity,
    item.unitPrice,
    item.includeVat,
    item.vatPercent,
  )

  return {
    ...item,
    ...pricing,
  }
}

export function lineItemDraftsToFormItems(
  items: JobCardLineItemDraft[],
): JobCardFormItem[] {
  return items.map((item) => ({
    productId: item.productId,
    note: item.note,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    includeVat: item.includeVat,
  }))
}

export function getJobCardGrandTotal(jobCard: JobCard): number {
  return jobCard.items.reduce((sum, item) => sum + item.lineTotal, 0)
}

export function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
