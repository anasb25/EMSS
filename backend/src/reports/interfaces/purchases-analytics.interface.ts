import type { AnalyticsPartyPoint, AnalyticsTrendPoint } from './sales-analytics.interface';

export interface PurchasesAnalyticsTrendPoint {
  period: string;
  label: string;
  bills: number;
  expenses: number;
}

export interface PurchasesAnalytics {
  dateFrom: string;
  dateTo: string;
  trendGranularity: 'day' | 'week' | 'month';
  kpis: {
    billPurchases: number;
    operatingExpenses: number;
    totalSpend: number;
    billCount: number;
    expenseCount: number;
    apOutstanding: number;
    apUnpaidCount: number;
  };
  trend: PurchasesAnalyticsTrendPoint[];
  topVendors: AnalyticsPartyPoint[];
  expensesByCategory: AnalyticsTrendPoint[];
}

export type { AnalyticsPartyPoint, AnalyticsTrendPoint };
