import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PublicJobsController } from './public-jobs.controller';
import { PublicJobsService } from './public-jobs.service';
import { JobCompanyMembershipsRepository } from './repositories/job-company-memberships.repository';
import { JobVersionSkillsRepository } from './repositories/job-version-skills.repository';
import { JobVersionsRepository } from './repositories/job-versions.repository';
import { JobsRepository } from './repositories/jobs.repository';

@Module({
  imports: [AuthModule],
  controllers: [JobsController, PublicJobsController],
  providers: [JobsService, PublicJobsService, JobsRepository, JobVersionsRepository, JobVersionSkillsRepository, JobCompanyMembershipsRepository],
  exports: [JobsService, PublicJobsService, JobsRepository, JobVersionsRepository, JobVersionSkillsRepository],
})
export class JobsModule { }