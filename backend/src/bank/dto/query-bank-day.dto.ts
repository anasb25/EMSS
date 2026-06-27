import { IsDateString } from 'class-validator';

export class QueryBankDayDto {
  @IsDateString()
  date: string;
}
