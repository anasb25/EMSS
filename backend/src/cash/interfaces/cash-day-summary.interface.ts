import { CashEntry } from '../entities/cash-entry.entity';

export interface CashDayEntry extends CashEntry {
  runningBalance: number;
  serialNo?: number;
  accountName?: string | null;
}

export interface CashDaySummary {
  date: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  hasOpeningBalance: boolean;
  entries: CashDayEntry[];
}
