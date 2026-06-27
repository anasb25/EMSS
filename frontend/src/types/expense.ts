import type { PaymentMethod } from '@/types/receivable'
import type { Vendor } from '@/types/vendor'
import type { PeriodDateRange, PeriodFilter } from '@/types/period-filter'
import { getPeriodRange, periodLabel } from '@/types/period-filter'

export interface ExpenseCategory {
  id: number
  name: string
}

export interface ExpenseCreator {
  id: string
  username: string
}

export interface Expense {
  id: number
  expenseDate: string
  amount: number
  subtotal: number
  vatAmount: number
  includeVat: boolean
  vatPercent: number
  description: string
  categoryId: number
  category?: ExpenseCategory
  paymentMethodId: number
  paymentMethod?: PaymentMethod
  vendorId: string | null
  vendor?: Vendor | null
  notes: string | null
  createdById: string | null
  createdBy?: ExpenseCreator | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseFormData {
  expenseDate: string
  amount: string
  includeVat: boolean
  description: string
  categoryId: string
  paymentMethodId: string
  vendorId: string
  notes: string
}

export type ExpensePeriodFilter = PeriodFilter

export type ExpenseDateRange = PeriodDateRange

export { getPeriodRange as getExpensePeriodRange, periodLabel as expensePeriodLabel }

export interface ExpensesSummary {
  todayAmount: number
  todayCount: number
  filteredAmount: number
  filteredCount: number
}

export interface ExpensesListResponse {
  data: Expense[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  summary: ExpensesSummary
}

export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyExpenseForm(
  expenseDate = todayDateInputValue(),
): ExpenseFormData {
  return {
    expenseDate,
    amount: '',
    includeVat: false,
    description: '',
    categoryId: '',
    paymentMethodId: '',
    vendorId: '',
    notes: '',
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateExpensePricing(
  amount: number,
  includeVat: boolean,
  vatPercent = 5,
) {
  const subtotal = roundMoney(amount)
  const vatAmount = includeVat ? roundMoney(subtotal * (vatPercent / 100)) : 0
  const total = roundMoney(subtotal + vatAmount)
  return { subtotal, vatAmount, total, vatPercent }
}

export function formatExpenseMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatExpenseDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatExpenseDateLong(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
