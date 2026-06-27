import { ProfitLossBasis } from './profit-loss-report.interface';

export interface AccountingDashboardKpis {
  revenue: number;
  expenses: number;
  netProfit: number;
  grossProfit: number | null;
  outputVat: number;
  inputVat: number;
  netVat: number;
  cashIn: number;
  cashOut: number;
  cashNet: number;
  arOutstanding: number;
  apOutstanding: number;
  arUnpaidCount: number;
  apUnpaidCount: number;
  invoiceCount: number;
  billCount: number;
  expenseCount: number;
}

export interface AccountingTrendPoint {
  period: string;
  label: string;
  revenue: number;
  expenses: number;
}

export interface AccountingCategoryPoint {
  label: string;
  amount: number;
}

export interface AccountingCashFlowPoint {
  period: string;
  label: string;
  cashIn: number;
  cashOut: number;
}

export interface AccountingStatusBreakdown {
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface AccountingDashboard {
  dateFrom: string;
  dateTo: string;
  basis: ProfitLossBasis;
  trendGranularity: 'day' | 'week' | 'month';
  kpis: AccountingDashboardKpis;
  revenueExpenseTrend: AccountingTrendPoint[];
  expenseByCategory: AccountingCategoryPoint[];
  cashFlowTrend: AccountingCashFlowPoint[];
  receivablesStatus: AccountingStatusBreakdown;
  payablesStatus: AccountingStatusBreakdown;
}
