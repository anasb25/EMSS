import { SalesEntry } from '../entities/sales-entry.entity';

export interface SalesPeriodSummary {
  dateFrom?: string;
  dateTo?: string;
  todayTotal: number;
  todayCount: number;
  totalSales: number;
  entryCount: number;
  entries: SalesEntry[];
}
