import { ReceiptVoucher } from '../entities/receipt-voucher.entity';

export interface ReceiptVouchersPaginatedResult {
  data: ReceiptVoucher[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
