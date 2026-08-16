import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { storageConfig } from './config/storage.config';
import { aiConfig } from './config/ai.config';

import { DatabaseModule } from './infrastructure/database/database.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AiClientModule } from './infrastructure/ai/ai-client.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { RecruitersModule } from './modules/recruiters/recruiters.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SkillsModule } from './modules/skills/skills.module';
import { FilesModule } from './modules/files/files.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { MatchingModule } from './modules/matching/matching.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, storageConfig, aiConfig],
    }),

    DatabaseModule,
    StorageModule,
    AiClientModule,

    AuthModule,
    UsersModule,
    CandidatesModule,
    RecruitersModule,
    CompaniesModule,
    SkillsModule,
    FilesModule,
    ResumesModule,
    JobsModule,
    ApplicationsModule,
    MatchingModule,
  ],
})
export class AppModule { }
