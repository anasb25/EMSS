import { IsIn, IsOptional, IsString } from 'class-validator';
import { QueryDateRangeDto } from '../../common/dto/query-date-range.dto';

export class QueryCustomerLedgerDto extends QueryDateRangeDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['all', 'unpaid', 'paid'])
  status?: 'all' | 'unpaid' | 'paid';

  @IsOptional()
  @IsIn(['all', 'invoice', 'manual_receivable', 'payment'])
  type?: 'all' | 'invoice' | 'manual_receivable' | 'payment';
}
