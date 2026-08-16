import { Module } from '@nestjs/common';
import { RecruitersController } from './recruiters.controller';
import { RecruitersService } from './recruiters.service';
import { RecruitersRepository } from './repositories/recruiters.repository';

@Module({
  controllers: [RecruitersController],
  providers: [RecruitersService, RecruitersRepository],
  exports: [RecruitersService, RecruitersRepository],
})
export class RecruitersModule {}
