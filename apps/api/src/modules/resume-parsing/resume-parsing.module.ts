import { Module } from '@nestjs/common';
import { AiClientModule } from '../../infrastructure/ai/ai-client.module';
import { AuthModule } from '../auth/auth.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { FilesModule } from '../files/files.module';
import { AiPipelineVersionsRepository } from './repositories/ai-pipeline-versions.repository';
import { ResumeEducationsRepository } from './repositories/resume-educations.repository';
import { ResumeExperiencesRepository } from './repositories/resume-experiences.repository';
import { ResumeParseRunsRepository } from './repositories/resume-parse-runs.repository';
import { ResumeParsingSourceRepository } from './repositories/resume-parsing-source.repository';
import { ResumeSkillsRepository } from './repositories/resume-skills.repository';
import { ResumeParsingController } from './resume-parsing.controller';
import { ResumeParsingService } from './resume-parsing.service';
import { SkillsModule } from '../skills/skills.module';
import { ResumeSkillExtractionService } from './resume-skill-extraction.service';
import { ResumeExperienceExtractionService } from './resume-experience-extraction.service';
import { ResumeEducationExtractionService } from './resume-education-extraction.service';

@Module({
  imports: [AuthModule, CandidatesModule, AiClientModule, FilesModule, SkillsModule],
  controllers: [ResumeParsingController],
  providers: [
    ResumeParsingService,
    ResumeSkillExtractionService,
    ResumeExperienceExtractionService,
    ResumeEducationExtractionService,
    AiPipelineVersionsRepository,
    ResumeParsingSourceRepository,
    ResumeParseRunsRepository,
    ResumeSkillsRepository,
    ResumeExperiencesRepository,
    ResumeEducationsRepository,
  ],
  exports: [
    ResumeParsingService,
    ResumeSkillExtractionService,
    ResumeExperienceExtractionService,
    ResumeEducationExtractionService,
    ResumeParseRunsRepository,
    ResumeSkillsRepository,
    ResumeExperiencesRepository,
    ResumeEducationsRepository,
  ],
})
export class ResumeParsingModule { }