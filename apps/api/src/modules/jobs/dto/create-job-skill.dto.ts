import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class CreateJobSkillDto {
  @IsUUID()
  skillId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  importance?: number = 3;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'number' ? String(value) : value)
  @IsString()
  @Matches(/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/)
  weight?: string = '1';

  @IsOptional()
  @IsInt()
  @Min(0)
  minExperienceMonths?: number | null;
}