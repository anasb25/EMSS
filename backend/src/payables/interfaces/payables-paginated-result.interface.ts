import { Payable } from '../entities/payable.entity';

export interface PayablesPaginatedResult {
  data: Payable[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
