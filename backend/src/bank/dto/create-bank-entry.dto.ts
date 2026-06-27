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

export class CreateBankEntryDto {
  @IsDateString()
  entryDate: string;

  @IsString()
  @MaxLength(500)
  description: string;

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

  @ValidateIf((dto: CreateBankEntryDto) => dto.accountType === BankAccountType.ACCOUNT)
  @IsNumber()
  ledgerAccountId?: number;

  @ValidateIf((dto: CreateBankEntryDto) => dto.accountType === BankAccountType.VENDOR)
  @IsUUID()
  vendorId?: string;

  @ValidateIf((dto: CreateBankEntryDto) => dto.accountType === BankAccountType.CUSTOMER)
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
