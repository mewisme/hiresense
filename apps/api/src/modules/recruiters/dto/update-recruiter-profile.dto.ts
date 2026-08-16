import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const isProvided = (
  _object: unknown,
  value: unknown,
): boolean => value !== undefined;

export class UpdateRecruiterProfileDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @ValidateIf(isProvided)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  jobTitle?: string | null;
}