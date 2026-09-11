import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { EDUCATION_MIN_DEGREES } from '../types/education-min-degree.type';
import { CreateJobSkillDto } from './create-job-skill.dto';

export class CreateJobDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string | null;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  responsibilities?: string | null;

  @IsOptional()
  @IsString()
  benefits?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  employmentType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  workplaceType?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceMinMonths?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceMaxMonths?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim().toUpperCase();
    return trimmed.length === 0 ? null : trimmed;
  })
  @ValidateIf((_, value) => value != null)
  @IsIn([...EDUCATION_MIN_DEGREES])
  educationMinDegree?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'number' ? String(value) : value))
  @IsString()
  @Matches(/^\d+(?:\.\d{1,4})?$/)
  salaryMin?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'number' ? String(value) : value))
  @IsString()
  @Matches(/^\d+(?:\.\d{1,4})?$/)
  salaryMax?: string | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  salaryCurrency?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJobSkillDto)
  skills?: CreateJobSkillDto[];
}
