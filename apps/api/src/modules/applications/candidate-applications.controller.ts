import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ApplicationsService } from './applications.service';
import { toApplicationResponse } from './mappers/application-response.mapper';
import { toCandidateApplicationDetailResponse, toCandidateApplicationListItemResponse } from './mappers/candidate-application-response.mapper';

@Controller('candidates/me/applications')
@Auth('CANDIDATE')
export class CandidateApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  @Get()
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    const applications = await this.applicationsService.listMine(user.id);
    return applications.map(toCandidateApplicationListItemResponse);
  }

  @Get(':applicationId')
  async getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.applicationsService.getMine(applicationId, user.id);
    return toCandidateApplicationDetailResponse(result.application, result.history);
  }

  @Post(':applicationId/withdraw')
  async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.applicationsService.withdraw(applicationId, user.id);
    return toApplicationResponse(result.application, result.currentStage);
  }
}