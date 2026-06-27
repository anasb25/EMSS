import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { JobCardItemDto } from './job-card-item.dto';

export class CreateJobCardDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

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

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => JobCardItemDto)
  items: JobCardItemDto[];
}
