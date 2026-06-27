import { Bill } from '../entities/bill.entity';

export interface BillsPaginatedResult {
  data: Bill[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
