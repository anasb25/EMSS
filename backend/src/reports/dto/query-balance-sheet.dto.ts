import { IsDateString, IsOptional } from 'class-validator';

export class QueryBalanceSheetDto {
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}
