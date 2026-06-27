export type BankLedgerEntryType =
  | 'manual'
  | 'customer_receipt'
  | 'expense'
  | 'vendor_payment';

export type BankAccountType = 'account' | 'vendor' | 'customer';

export interface BankDayEntry {
  id: number | string;
  entryDate: string;
  type: BankLedgerEntryType;
  bankIn: number;
  bankOut: number;
  description: string;
  accountType: BankAccountType | null;
  ledgerAccountId: number | null;
  vendorId: string | null;
  customerId: string | null;
  ledgerAccount?: { id: number; name: string } | null;
  vendor?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
  salesPersonName: string | null;
  remarks: string | null;
  paymentMethod: string | null;
  createdAt: Date;
  runningBalance?: number;
  serialNo?: number;
}

export interface BankDaySummary {
  date: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  entries: BankDayEntry[];
}
