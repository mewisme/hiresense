import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { CandidateApplicationsController } from './candidate-applications.controller';
import { RecruiterApplicationsController } from './recruiter-applications.controller';
import { ApplicationCandidatesRepository } from './repositories/application-candidates.repository';
import { ApplicationCompanyMembershipsRepository } from './repositories/application-company-memberships.repository';
import { ApplicationJobsRepository } from './repositories/application-jobs.repository';
import { ApplicationStageHistoryRepository } from './repositories/application-stage-history.repository';
import { ApplicationsRepository } from './repositories/applications.repository';
import { RecruitmentStagesRepository } from './repositories/recruitment-stages.repository';

@Module({
  imports: [AuthModule],
  controllers: [ApplicationsController, CandidateApplicationsController, RecruiterApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationsRepository,
    RecruitmentStagesRepository,
    ApplicationStageHistoryRepository,
    ApplicationCandidatesRepository,
    ApplicationJobsRepository,
    ApplicationCompanyMembershipsRepository,
  ],
  exports: [ApplicationsService, ApplicationsRepository, RecruitmentStagesRepository, ApplicationStageHistoryRepository],
})
export class ApplicationsModule { }