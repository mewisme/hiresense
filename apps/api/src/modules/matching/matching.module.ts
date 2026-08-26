import { Module } from '@nestjs/common';
import { ResumeParsingModule } from '../resume-parsing/resume-parsing.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingRepository } from './repositories/matching.repository';
import { ApplicationBaselineMatchingService } from './services/application-baseline-matching.service';
import { ApplicationSkillMatchingService } from './services/application-skill-matching.service';
import { BaselineExperienceMatchingService } from './services/baseline-experience-matching.service';
import { BaselineOverallMatchingService } from './services/baseline-overall-matching.service';
import { BaselineSkillMatchingService } from './services/baseline-skill-matching.service';
import { JobSkillRequirementsService } from './services/job-skill-requirements.service';

@Module({
  imports: [ResumeParsingModule],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingRepository, JobSkillRequirementsService, BaselineSkillMatchingService, BaselineExperienceMatchingService, BaselineOverallMatchingService, ApplicationSkillMatchingService, ApplicationBaselineMatchingService],
  exports: [MatchingService, MatchingRepository, JobSkillRequirementsService, BaselineSkillMatchingService, BaselineExperienceMatchingService, BaselineOverallMatchingService, ApplicationSkillMatchingService, ApplicationBaselineMatchingService],
})
export class MatchingModule {}
