import { IsDateString, IsIn, IsOptional } from 'class-validator';
import type { ProfitLossBasis } from '../interfaces/profit-loss-report.interface';

export class QueryAccountingDashboardDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;

  @IsOptional()
  @IsIn(['accrual', 'cash'])
  basis?: ProfitLossBasis;
}
