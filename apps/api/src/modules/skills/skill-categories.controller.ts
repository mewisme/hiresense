import {
  Controller,
  Get,
} from '@nestjs/common';

import { Auth } from '../auth/decorators/auth.decorator';

import { SkillsService } from './skills.service';

@Controller('skill-categories')
export class SkillCategoriesController {
  constructor(
    private readonly skillsService:
      SkillsService,
  ) { }

  @Get()
  @Auth()
  listCategories() {
    return this.skillsService
      .listCategories();
  }
}