import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { toApplicationMatchRunResponse } from './mappers/application-match-run-response.mapper';
import { MatchingService } from './matching.service';

@Controller('companies/:companyId/applications/:applicationId/matching')
@Auth('RECRUITER')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('runs')
  async run(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return toApplicationMatchRunResponse(await this.matchingService.runForRecruiter(companyId, applicationId, user.id));
  }

  @Get('current')
  async getCurrent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return toApplicationMatchRunResponse(await this.matchingService.getCurrentForRecruiter(companyId, applicationId, user.id));
  }

  @Get('runs/:matchRunId')
  async getRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('matchRunId', ParseUUIDPipe) matchRunId: string,
  ) {
    return toApplicationMatchRunResponse(await this.matchingService.getRunForRecruiter(companyId, applicationId, matchRunId, user.id));
  }
}
