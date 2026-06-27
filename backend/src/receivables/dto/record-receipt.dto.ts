import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordReceiptDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId: number;

  @IsOptional()
  @IsString()
  bankDetail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  chequeNumber?: string;

  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  transactionReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
