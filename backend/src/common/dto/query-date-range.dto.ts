import { IsDateString, IsOptional } from 'class-validator';

export class QueryDateRangeDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
