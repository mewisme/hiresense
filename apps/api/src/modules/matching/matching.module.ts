import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingRepository } from './repositories/matching.repository';
import { BaselineSkillMatchingService } from './services/baseline-skill-matching.service';
import { JobSkillRequirementsService } from './services/job-skill-requirements.service';

@Module({
  controllers: [MatchingController],
  providers: [MatchingService, MatchingRepository, JobSkillRequirementsService, BaselineSkillMatchingService],
  exports: [MatchingService, MatchingRepository, JobSkillRequirementsService, BaselineSkillMatchingService],
})
export class MatchingModule {}
