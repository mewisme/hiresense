import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { ResumeVersionsRepository } from './repositories/resume-versions.repository';
import { ResumesRepository } from './repositories/resumes.repository';
import { ResumesService } from './resumes.service';

@Module({
  imports: [FilesModule],
  providers: [ResumesRepository, ResumeVersionsRepository, ResumesService],
  exports: [ResumesService, ResumesRepository, ResumeVersionsRepository],
})
export class ResumesModule { }