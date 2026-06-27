import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CashAccountType } from '../entities/cash-entry.entity';

export class CreateCashEntryDto {
  @IsDateString()
  entryDate: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashIn?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashOut?: number;

  @IsOptional()
  @IsEnum(CashAccountType)
  accountType?: CashAccountType;

  @ValidateIf((dto: CreateCashEntryDto) => dto.accountType === CashAccountType.ACCOUNT)
  @IsNumber()
  ledgerAccountId?: number;

  @ValidateIf((dto: CreateCashEntryDto) => dto.accountType === CashAccountType.VENDOR)
  @IsUUID()
  vendorId?: string;

  @ValidateIf((dto: CreateCashEntryDto) => dto.accountType === CashAccountType.CUSTOMER)
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  salesPersonName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
