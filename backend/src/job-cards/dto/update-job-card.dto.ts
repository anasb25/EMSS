import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { JobCardItemDto } from './job-card-item.dto';

export class UpdateJobCardDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  blNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  declarationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  containerNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsBoolean()
  transport?: boolean;

  @IsOptional()
  @IsBoolean()
  logistics?: boolean;

  @IsOptional()
  @IsBoolean()
  isImport?: boolean;

  @IsOptional()
  @IsBoolean()
  isExport?: boolean;

  @IsOptional()
  @IsBoolean()
  freight?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobCardItemDto)
  items?: JobCardItemDto[];
}
