import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { SkillCategoriesRepository } from './repositories/skill-categories.repository';
import { SkillsRepository } from './repositories/skills.repository';
import { SkillCategoriesController } from './skill-categories.controller';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    SkillCategoriesController,
    SkillsController,
  ],

  providers: [
    SkillsService,
    SkillCategoriesRepository,
    SkillsRepository,
  ],

  exports: [
    SkillsService,
    SkillCategoriesRepository,
    SkillsRepository,
  ],
})
export class SkillsModule { }