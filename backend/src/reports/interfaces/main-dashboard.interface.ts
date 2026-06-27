export type MainDashboardActivityType = 'job_card' | 'invoice';

export interface MainDashboardActivity {
  id: string;
  type: MainDashboardActivityType;
  title: string;
  subtitle: string;
  amount: number | null;
  occurredAt: string;
}

export interface MainDashboardKpis {
  activeCustomers: number;
  openJobCards: number;
  jobCardsOpenedToday: number;
  monthRevenue: number;
  monthInvoiceCount: number;
  monthCollections: number;
  monthPurchases: number;
  monthOperatingExpenses: number;
  monthTotalSpend: number;
  monthNetProfit: number;
  monthNetVat: number;
  cashBalance: number;
  arOutstanding: number;
  arUnpaidCount: number;
  apOutstanding: number;
  apUnpaidCount: number;
}

export interface MainDashboardTrendPoint {
  period: string;
  label: string;
  sales: number;
  purchases: number;
}

export interface MainDashboard {
  monthLabel: string;
  dateFrom: string;
  dateTo: string;
  kpis: MainDashboardKpis;
  salesPurchasesTrend: MainDashboardTrendPoint[];
  recentActivity: MainDashboardActivity[];
}
