import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ApplyJobDto } from './dto/apply-job.dto';
import { ApplicationsService } from './applications.service';
import { toApplicationResponse } from './mappers/application-response.mapper';

@Controller('jobs')
@Auth('CANDIDATE')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Post(':jobId/applications')
  async apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: ApplyJobDto,
  ) {
    const result = await this.applicationsService.apply(jobId, user.id, dto);
    return toApplicationResponse(result.application, result.currentStage);
  }
}