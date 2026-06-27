export type CashEntryType =
  | 'expense'
  | 'vendor_payment'
  | 'opening_adjustment'
  | 'manual'

export type CashEntryDirection = 'in' | 'out'

export type CashAccountType = 'account' | 'vendor' | 'customer'

export interface CashEntryCreator {
  id: string
  username: string
}

export interface CashEntryExpenseCategory {
  id: number
  name: string
}

export interface CashEntryExpense {
  id: number
  category?: CashEntryExpenseCategory
}

export interface CashEntryPayableBill {
  id: string
  billNumber: string
}

export interface CashEntryPayable {
  id: number
  bill?: CashEntryPayableBill | null
}

export interface CashEntryAccountRef {
  id: number | string
  name: string
}

export interface CashEntry {
  id: number
  entryDate: string
  type: CashEntryType
  direction: CashEntryDirection
  amount: number
  cashIn: number
  cashOut: number
  description: string
  accountType: CashAccountType | null
  ledgerAccountId: number | null
  vendorId: string | null
  customerId: string | null
  ledgerAccount?: CashEntryAccountRef | null
  vendor?: CashEntryAccountRef | null
  customer?: CashEntryAccountRef | null
  salesPersonName: string | null
  remarks: string | null
  expenseId: number | null
  expense?: CashEntryExpense | null
  payableId: number | null
  payable?: CashEntryPayable | null
  createdById: string | null
  createdBy?: CashEntryCreator | null
  createdAt: string
  updatedAt: string
  runningBalance?: number
  serialNo?: number
  accountName?: string | null
}

export interface CashDaySummary {
  date: string
  openingBalance: number
  totalIn: number
  totalOut: number
  closingBalance: number
  hasOpeningBalance: boolean
  entries: CashEntry[]
}

export interface CashPeriodSummary {
  dateFrom?: string
  dateTo?: string
  todayIn: number
  todayOut: number
  openingBalance: number
  totalIn: number
  totalOut: number
  closingBalance: number
  hasOpeningBalance: boolean
  entries: CashEntry[]
}

export interface CashEntryFormData {
  entryDate: string
  description: string
  cashIn: string
  cashOut: string
  accountType: '' | CashAccountType
  accountId: string
  salesPersonName: string
  remarks: string
}

export interface OpeningBalanceFormData {
  entryDate: string
  amount: string
  notes: string
}

export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyOpeningBalanceForm(
  entryDate = todayDateInputValue(),
): OpeningBalanceFormData {
  return {
    entryDate,
    amount: '',
    notes: '',
  }
}

export function emptyCashEntryForm(
  entryDate = todayDateInputValue(),
): CashEntryFormData {
  return {
    entryDate,
    description: '',
    cashIn: '',
    cashOut: '',
    accountType: '',
    accountId: '',
    salesPersonName: '',
    remarks: '',
  }
}

export function formatCashMoney(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCashDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatCashDateLong(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function cashEntryTypeLabel(type: CashEntryType): string {
  switch (type) {
    case 'expense':
      return 'Expense'
    case 'vendor_payment':
      return 'Vendor Payment'
    case 'opening_adjustment':
      return 'Opening Balance'
    case 'manual':
      return 'Manual'
    default:
      return type
  }
}

export function cashAccountTypeLabel(type: CashAccountType): string {
  switch (type) {
    case 'account':
      return 'Accounts'
    case 'vendor':
      return 'Vendors'
    case 'customer':
      return 'Customers'
    default:
      return type
  }
}

export function entryAccountId(entry: CashEntry): string {
  if (entry.accountType === 'account' && entry.ledgerAccountId) {
    return String(entry.ledgerAccountId)
  }
  if (entry.accountType === 'vendor' && entry.vendorId) {
    return entry.vendorId
  }
  if (entry.accountType === 'customer' && entry.customerId) {
    return entry.customerId
  }
  return ''
}

export function isEditableCashEntry(entry: CashEntry): boolean {
  return entry.type === 'manual'
}
