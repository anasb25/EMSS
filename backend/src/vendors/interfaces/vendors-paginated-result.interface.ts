import { Vendor } from '../entities/vendor.entity';

export interface VendorsPaginatedResult {
  data: Vendor[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
