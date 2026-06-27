import { Expense } from '../entities/expense.entity';

export interface ExpensesSummary {
  todayAmount: number;
  todayCount: number;
  filteredAmount: number;
  filteredCount: number;
}

export interface ExpensesPaginatedResult {
  data: Expense[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: ExpensesSummary;
}
