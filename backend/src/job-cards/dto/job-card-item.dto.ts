import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class JobCardItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @IsString()
  note?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsBoolean()
  includeVat: boolean;
}
