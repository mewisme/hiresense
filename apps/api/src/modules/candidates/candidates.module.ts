import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { CandidateProfilesRepository } from './repositories/candidate-profiles.repository';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    CandidatesController,
  ],

  providers: [
    CandidatesService,
    CandidateProfilesRepository,
  ],
})
export class CandidatesModule { }