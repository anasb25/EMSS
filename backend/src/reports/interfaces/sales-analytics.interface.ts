export interface AnalyticsTrendPoint {
  period: string;
  label: string;
  amount: number;
}

export interface AnalyticsPartyPoint {
  id: string;
  name: string;
  amount: number;
  documentCount: number;
}

export interface SalesAnalyticsTrendPoint {
  period: string;
  label: string;
  invoiced: number;
  collected: number;
}

export interface SalesAnalytics {
  dateFrom: string;
  dateTo: string;
  trendGranularity: 'day' | 'week' | 'month';
  kpis: {
    invoicedRevenue: number;
    collectedRevenue: number;
    collectionGap: number;
    invoiceCount: number;
    collectionCount: number;
    arOutstanding: number;
    arUnpaidCount: number;
  };
  trend: SalesAnalyticsTrendPoint[];
  topCustomers: AnalyticsPartyPoint[];
}
