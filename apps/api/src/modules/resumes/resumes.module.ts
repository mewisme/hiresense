import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { ResumesRepository } from './repositories/resumes.repository';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService, ResumesRepository],
  exports: [ResumesService, ResumesRepository],
})
export class ResumesModule {}
