import { Customer } from '../entities/customer.entity';

export type CustomerLedgerEntryType =
  | 'invoice'
  | 'manual_receivable'
  | 'payment';

export type CustomerLedgerEntryStatus = 'paid' | 'unpaid';

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: CustomerLedgerEntryType;
  reference: string;
  description: string;
  debit: number | null;
  credit: number | null;
  runningBalance: number;
  status: CustomerLedgerEntryStatus;
  receivableId: number | null;
  invoiceId: string | null;
  receiptVoucherId: number | null;
  dueDate: string | null;
  isOverdue: boolean;
}

export interface CustomerLedgerSummary {
  openingBalance: number;
  totalCharges: number;
  totalPayments: number;
  closingBalance: number;
  overdueAmount: number;
  unpaidCount: number;
  paidCount: number;
}

export interface CustomerLedger {
  customer: Customer;
  summary: CustomerLedgerSummary;
  entries: CustomerLedgerEntry[];
}

export interface CustomerLedgerListItem {
  customerId: string;
  customerName: string;
  email: string | null;
  isActive: boolean;
  outstanding: number;
  totalPaid: number;
  unpaidCount: number;
  lastActivity: string | null;
}

export interface CustomerLedgerListResult {
  data: CustomerLedgerListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
