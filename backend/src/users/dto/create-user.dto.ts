import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleName } from '../../roles/entities/role.entity';

export class CreateUserDto {
  @IsString()
  @MaxLength(100)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsEnum(RoleName)
  role: RoleName;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
