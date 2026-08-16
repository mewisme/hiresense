import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { CandidatesRepository } from './repositories/candidates.repository';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService, CandidatesRepository],
  exports: [CandidatesService, CandidatesRepository],
})
export class CandidatesModule {}
