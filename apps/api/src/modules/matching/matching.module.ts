import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingRepository } from './repositories/matching.repository';

@Module({
  controllers: [MatchingController],
  providers: [MatchingService, MatchingRepository],
  exports: [MatchingService, MatchingRepository],
})
export class MatchingModule {}
