import { Customer } from '../entities/customer.entity';

export interface CustomersPaginatedResult {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
