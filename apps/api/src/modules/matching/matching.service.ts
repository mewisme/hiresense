import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationMatchRunsRepository } from './repositories/application-match-runs.repository';
import { ApplicationBaselineMatchingService } from './services/application-baseline-matching.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly applicationMatchRunsRepository: ApplicationMatchRunsRepository,
    private readonly applicationBaselineMatchingService: ApplicationBaselineMatchingService,
  ) {}

  async runForRecruiter(companyId: string, applicationId: string, userId: string) {
    await this.requireRecruiterApplicationAccess(companyId, applicationId, userId);
    return this.applicationBaselineMatchingService.run(applicationId);
  }

  async getCurrentForRecruiter(companyId: string, applicationId: string, userId: string) {
    await this.requireRecruiterApplicationAccess(companyId, applicationId, userId);
    const run = await this.applicationMatchRunsRepository.findCurrentByApplicationId(applicationId);
    if (!run) throw new NotFoundException('Application match result not found');
    return run;
  }

  async getRunForRecruiter(companyId: string, applicationId: string, matchRunId: string, userId: string) {
    await this.requireRecruiterApplicationAccess(companyId, applicationId, userId);
    const run = await this.applicationMatchRunsRepository.findByIdForApplication(matchRunId, applicationId);
    if (!run) throw new NotFoundException('Application match run not found');
    return run;
  }

  private async requireRecruiterApplicationAccess(companyId: string, applicationId: string, userId: string) {
    await this.applicationsService.getForRecruiter(companyId, applicationId, userId);
  }
}
