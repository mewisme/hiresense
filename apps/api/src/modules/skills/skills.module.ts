import { Module } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { SkillsRepository } from './repositories/skills.repository';

@Module({
  controllers: [SkillsController],
  providers: [SkillsService, SkillsRepository],
  exports: [SkillsService, SkillsRepository],
})
export class SkillsModule {}
