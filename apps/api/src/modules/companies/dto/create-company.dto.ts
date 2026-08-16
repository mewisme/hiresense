import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import { normalizeCompanySlug } from '../utils/company-slug.util';
import { IsValidCompanySizeRange } from '../validators/company-size-range.validator';

@IsValidCompanySizeRange()
export class CreateCompanyDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? normalizeCompanySlug(value)
      : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsUrl({
    protocols: [
      'http',
      'https',
    ],
    require_protocol: true,
  })
  @MaxLength(2048)
  websiteUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  companySizeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  companySizeMax?: number;
}