import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CandidatesService } from '../candidates/candidates.service';
import { toResumeParseStatusResponse } from './mappers/resume-parse-response.mapper';
import { ResumeParsingService } from './resume-parsing.service';

@Controller('resumes')
@Auth('CANDIDATE')
export class ResumeParsingController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly resumeParsingService: ResumeParsingService,
  ) { }

  @Post(':resumeId/versions/:versionId/parse-runs')
  async parse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    const candidate = await this.requireCandidate(user.id);
    const result = await this.resumeParsingService.parseForCandidate(resumeId, versionId, candidate.id);
    return toResumeParseStatusResponse(result.parseRun, result.reused);
  }

  @Get(':resumeId/versions/:versionId/parse-runs/latest')
  async latest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    const candidate = await this.requireCandidate(user.id);
    const parseRun = await this.resumeParsingService.getLatestForCandidate(resumeId, versionId, candidate.id);
    return parseRun ? toResumeParseStatusResponse(parseRun) : null;
  }

  private async requireCandidate(userId: string) {
    const candidate = await this.candidatesService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');
    return candidate;
  }
}
