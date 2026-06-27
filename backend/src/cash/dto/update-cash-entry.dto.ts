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

export class UpdateCashEntryDto {
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

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

  @ValidateIf((dto: UpdateCashEntryDto) => dto.accountType === CashAccountType.ACCOUNT)
  @IsOptional()
  @IsNumber()
  ledgerAccountId?: number;

  @ValidateIf((dto: UpdateCashEntryDto) => dto.accountType === CashAccountType.VENDOR)
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ValidateIf((dto: UpdateCashEntryDto) => dto.accountType === CashAccountType.CUSTOMER)
  @IsOptional()
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
