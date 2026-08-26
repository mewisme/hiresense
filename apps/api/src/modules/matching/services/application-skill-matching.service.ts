import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ResumeParseRunsRepository } from '../../resume-parsing/repositories/resume-parse-runs.repository';
import { MatchingRepository } from '../repositories/matching.repository';
import { BaselineSkillMatchingService, type BaselineSkillMatchScore } from './baseline-skill-matching.service';
import { JobSkillRequirementsService } from './job-skill-requirements.service';

export interface ApplicationSkillMatchPreview {
  applicationId: string;
  jobVersionId: string;
  resumeVersionId: string;
  resumeParseRunId: string;
  skillScore: BaselineSkillMatchScore;
}

@Injectable()
export class ApplicationSkillMatchingService {
  constructor(
    private readonly matchingRepository: MatchingRepository,
    private readonly resumeParseRunsRepository: ResumeParseRunsRepository,
    private readonly jobSkillRequirementsService: JobSkillRequirementsService,
    private readonly baselineSkillMatchingService: BaselineSkillMatchingService,
  ) {}

  async preview(applicationId: string): Promise<ApplicationSkillMatchPreview> {
    const application = await this.matchingRepository.findApplicationSource(applicationId);
    if (!application) throw new NotFoundException('Application not found');

    const [requirements, parseRun] = await Promise.all([
      this.jobSkillRequirementsService.getSnapshot(application.jobVersionId),
      this.resumeParseRunsRepository.findLatestSucceededByResumeVersionId(application.resumeVersionId),
    ]);

    if (!requirements) throw new NotFoundException('Application job version not found');
    if (!parseRun) throw new BadRequestException('Application resume has no successful parse result');

    const skillScore = this.baselineSkillMatchingService.score(
      requirements.skills,
      parseRun.skills.map((skill) => ({ resumeSkillId: skill.id, skillId: skill.skillId, evidenceText: skill.evidenceText })),
    );

    return {
      applicationId: application.id,
      jobVersionId: application.jobVersionId,
      resumeVersionId: application.resumeVersionId,
      resumeParseRunId: parseRun.id,
      skillScore,
    };
  }
}