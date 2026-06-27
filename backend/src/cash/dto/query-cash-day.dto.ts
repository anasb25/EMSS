import { IsDateString } from 'class-validator';

export class QueryCashDayDto {
  @IsDateString()
  date: string;
}
