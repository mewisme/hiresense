import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { RecruiterProfilesRepository } from './repositories/recruiter-profiles.repository';
import { RecruitersController } from './recruiters.controller';
import { RecruitersService } from './recruiters.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    RecruitersController,
  ],

  providers: [
    RecruitersService,
    RecruiterProfilesRepository,
  ],

  exports: [
    RecruitersService,
  ],
})
export class RecruitersModule { }