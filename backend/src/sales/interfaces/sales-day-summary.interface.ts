import { SalesEntry } from '../entities/sales-entry.entity';

export interface SalesDaySummary {
  date: string;
  totalSales: number;
  entryCount: number;
  entries: SalesEntry[];
}
