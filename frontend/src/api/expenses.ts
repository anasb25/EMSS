import { apiRequest } from '@/api/http'
import type {
  Expense,
  ExpenseCategory,
  ExpenseFormData,
  ExpensesListResponse,
} from '@/types/expense'

export interface FetchExpensesParams {
  search?: string
  categoryId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

function buildQuery(params: FetchExpensesParams): string {
  const query = new URLSearchParams()

  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.categoryId) query.set('categoryId', String(params.categoryId))
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

function toPayload(data: ExpenseFormData) {
  return {
    expenseDate: data.expenseDate,
    amount: Number(data.amount),
    includeVat: data.includeVat,
    description: data.description.trim(),
    categoryId: Number(data.categoryId),
    paymentMethodId: Number(data.paymentMethodId),
    vendorId: data.vendorId.trim() || undefined,
    notes: data.notes.trim() || undefined,
  }
}

export function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  return apiRequest<ExpenseCategory[]>('/expenses/categories')
}

export function fetchExpenses(
  params: FetchExpensesParams = {},
): Promise<ExpensesListResponse> {
  return apiRequest<ExpensesListResponse>(`/expenses${buildQuery(params)}`)
}

export function fetchExpense(id: number): Promise<Expense> {
  return apiRequest<Expense>(`/expenses/${id}`)
}

export function createExpense(data: ExpenseFormData): Promise<Expense> {
  return apiRequest<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(toPayload(data)),
  })
}

export function deleteExpense(id: number): Promise<void> {
  return apiRequest<void>(`/expenses/${id}`, {
    method: 'DELETE',
  })
}
