import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRecruiterProfileDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

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