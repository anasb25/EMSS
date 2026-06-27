import { IsDateString } from 'class-validator';

export class QueryDateRangeDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;
}
