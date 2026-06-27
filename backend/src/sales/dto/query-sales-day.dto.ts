import { IsDateString } from 'class-validator';

export class QuerySalesDayDto {
  @IsDateString()
  date: string;
}
