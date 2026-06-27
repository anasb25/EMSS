import { Product } from '../entities/product.entity';

export interface ProductsPaginatedResult {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
