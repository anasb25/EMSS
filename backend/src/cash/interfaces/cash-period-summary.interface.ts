import { CashDayEntry } from './cash-day-summary.interface';

export interface CashPeriodSummary {
  dateFrom?: string;
  dateTo?: string;
  todayIn: number;
  todayOut: number;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  hasOpeningBalance: boolean;
  entries: CashDayEntry[];
}
