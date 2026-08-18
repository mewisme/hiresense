import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ChangeApplicationStageDto {
  @IsUUID()
  stageId!: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() || null : value)
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}