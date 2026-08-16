import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { FilesModule } from '../files/files.module';
import { ResumeVersionsRepository } from './repositories/resume-versions.repository';
import { ResumesRepository } from './repositories/resumes.repository';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

@Module({
  imports: [AuthModule, CandidatesModule, FilesModule],
  controllers: [ResumesController],
  providers: [ResumesRepository, ResumeVersionsRepository, ResumesService],
  exports: [ResumesService, ResumesRepository, ResumeVersionsRepository],
})
export class ResumesModule { }