import { BankDayEntry } from './bank-day-summary.interface';

export interface BankPeriodSummary {
  dateFrom?: string;
  dateTo?: string;
  todayIn: number;
  todayOut: number;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  entries: BankDayEntry[];
}
