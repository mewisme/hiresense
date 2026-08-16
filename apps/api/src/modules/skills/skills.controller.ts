import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ListSkillsQueryDto } from './dto/list-skills-query.dto';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) { }

  @Get()
  @Auth()
  listSkills(@Query() query: ListSkillsQueryDto) {
    return this.skillsService.listActiveSkills(query.categoryId);
  }

  @Get(':skillId')
  @Auth()
  getSkill(
    @Param('skillId', new ParseUUIDPipe({ version: '7' })) skillId: string,
  ) {
    return this.skillsService.getSkillById(skillId);
  }

  @Post()
  @Auth('ADMIN')
  createSkill(@Body() dto: CreateSkillDto) {
    return this.skillsService.createCanonicalSkill({
      name: dto.name,
      categoryId: dto.categoryId,
      description: dto.description,
    });
  }
}