import { Invoice } from '../entities/invoice.entity';

export interface InvoicesPaginatedResult {
  data: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
