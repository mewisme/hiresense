import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingRepository } from './repositories/matching.repository';
import { JobSkillRequirementsService } from './services/job-skill-requirements.service';

@Module({
  controllers: [MatchingController],
  providers: [MatchingService, MatchingRepository, JobSkillRequirementsService],
  exports: [MatchingService, MatchingRepository, JobSkillRequirementsService],
})
export class MatchingModule {}
