import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReceivableDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId?: number;

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
