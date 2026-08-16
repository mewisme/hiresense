import {
  IsOptional,
  IsUUID,
} from 'class-validator';

export class ListSkillsQueryDto {
  @IsOptional()
  @IsUUID('all')
  categoryId?: string;
}