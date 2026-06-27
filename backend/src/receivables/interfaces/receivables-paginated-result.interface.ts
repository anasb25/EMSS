import { Receivable } from '../entities/receivable.entity';

export interface ReceivablesPaginatedResult {
  data: Receivable[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
