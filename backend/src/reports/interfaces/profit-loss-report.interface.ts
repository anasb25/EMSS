export type ProfitLossBasis = 'accrual' | 'cash';

export interface ProfitLossLine {
  key: string;
  label: string;
  amount: number;
  categoryId?: number;
}

export interface ProfitLossSection {
  lines: ProfitLossLine[];
  total: number;
}

export interface ProfitLossReport {
  dateFrom: string;
  dateTo: string;
  basis: ProfitLossBasis;
  income: ProfitLossSection;
  purchases?: ProfitLossSection;
  grossProfit?: number;
  operatingExpenses: ProfitLossSection;
  netProfit: number;
}
