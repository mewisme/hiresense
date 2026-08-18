import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ApplyJobDto {
  @IsUUID()
  resumeVersionId!: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() || null : value)
  @IsString()
  @MaxLength(5000)
  coverLetter?: string | null;
}