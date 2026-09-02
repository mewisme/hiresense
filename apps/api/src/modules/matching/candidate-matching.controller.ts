import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { toApplicationMatchRunResponse } from './mappers/application-match-run-response.mapper';
import { MatchingService } from './matching.service';

@Controller('candidates/me/applications/:applicationId/matching')
@Auth('CANDIDATE')
export class CandidateMatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('current')
  async getCurrent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return toApplicationMatchRunResponse(
      await this.matchingService.getCurrentForCandidate(applicationId, user.id),
    );
  }
}
