export type BankEntryType =
  | 'manual'
  | 'customer_receipt'
  | 'expense'
  | 'vendor_payment'

export type BankAccountType = 'account' | 'vendor' | 'customer'

export interface BankEntryAccountRef {
  id: number | string
  name: string
}

export interface BankEntry {
  id: number | string
  entryDate: string
  type: BankEntryType
  bankIn: number
  bankOut: number
  description: string
  accountType: BankAccountType | null
  ledgerAccountId: number | null
  vendorId: string | null
  customerId: string | null
  ledgerAccount?: BankEntryAccountRef | null
  vendor?: BankEntryAccountRef | null
  customer?: BankEntryAccountRef | null
  salesPersonName: string | null
  remarks: string | null
  paymentMethod: string | null
  createdAt: string
  runningBalance?: number
  serialNo?: number
}

export interface BankDaySummary {
  date: string
  openingBalance: number
  totalIn: number
  totalOut: number
  closingBalance: number
  entries: BankEntry[]
}

export interface BankPeriodSummary {
  dateFrom?: string
  dateTo?: string
  todayIn: number
  todayOut: number
  openingBalance: number
  totalIn: number
  totalOut: number
  closingBalance: number
  entries: BankEntry[]
}

export interface BankEntryFormData {
  entryDate: string
  description: string
  bankIn: string
  bankOut: string
  accountType: '' | BankAccountType
  accountId: string
  salesPersonName: string
  remarks: string
}

export function emptyBankEntryForm(
  entryDate = new Date().toISOString().slice(0, 10),
): BankEntryFormData {
  return {
    entryDate,
    description: '',
    bankIn: '',
    bankOut: '',
    accountType: '',
    accountId: '',
    salesPersonName: '',
    remarks: '',
  }
}

export function bankEntryTypeLabel(type: BankEntryType): string {
  switch (type) {
    case 'manual':
      return 'Manual'
    case 'customer_receipt':
      return 'Customer Receipt'
    case 'expense':
      return 'Expense'
    case 'vendor_payment':
      return 'Vendor Payment'
    default:
      return type
  }
}

export function bankAccountTypeLabel(type: BankAccountType): string {
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

export function entryAccountId(entry: BankEntry): string {
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

export function isEditableBankEntry(entry: BankEntry): boolean {
  return entry.type === 'manual'
}

export {
  formatCashMoney as formatBankMoney,
  formatCashDate as formatBankDate,
  formatCashDateLong as formatBankDateLong,
} from '@/types/cash'
