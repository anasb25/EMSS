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
import { BankAccountType } from '../entities/bank-entry.entity';

export class UpdateBankEntryDto {
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
  bankIn?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  bankOut?: number;

  @IsOptional()
  @IsEnum(BankAccountType)
  accountType?: BankAccountType;

  @ValidateIf((dto: UpdateBankEntryDto) => dto.accountType === BankAccountType.ACCOUNT)
  @IsOptional()
  @IsNumber()
  ledgerAccountId?: number;

  @ValidateIf((dto: UpdateBankEntryDto) => dto.accountType === BankAccountType.VENDOR)
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ValidateIf((dto: UpdateBankEntryDto) => dto.accountType === BankAccountType.CUSTOMER)
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
