import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RecruiterApplicationsQueryDto {
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? 1 : Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? 20 : Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}