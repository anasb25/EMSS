import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateBillItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsString()
  note?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsBoolean()
  includeVat?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vatPercent?: number;
}

export class CreateBillDto {
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vendorReference?: string;

  @IsDateString()
  billDate: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateBillItemDto)
  items: CreateBillItemDto[];
}
