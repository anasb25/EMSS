import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional } from 'class-validator';
import type { VatReportFilter } from '../interfaces/vat-report.interface';

export class QueryVatReportDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;

  @IsOptional()
  @IsIn(['all', 'sales', 'purchases', 'paynow'])
  filter?: VatReportFilter;
}
