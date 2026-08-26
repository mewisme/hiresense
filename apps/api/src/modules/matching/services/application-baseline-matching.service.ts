import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { MATCHING_BASELINE_PIPELINE_CODE, MATCHING_PIPELINE_TYPE } from '../constants/matching.constants';
import { ResumeParseRunsRepository } from '../../resume-parsing/repositories/resume-parse-runs.repository';
import { MatchingRepository } from '../repositories/matching.repository';
import { BaselineExperienceMatchingService } from './baseline-experience-matching.service';
import { BaselineOverallMatchingService } from './baseline-overall-matching.service';
import { BaselineSkillMatchingService } from './baseline-skill-matching.service';
import { JobSkillRequirementsService } from './job-skill-requirements.service';

@Injectable()
export class ApplicationBaselineMatchingService {
  constructor(
    private readonly matchingRepository: MatchingRepository,
    private readonly resumeParseRunsRepository: ResumeParseRunsRepository,
    private readonly jobSkillRequirementsService: JobSkillRequirementsService,
    private readonly baselineSkillMatchingService: BaselineSkillMatchingService,
    private readonly baselineExperienceMatchingService: BaselineExperienceMatchingService,
    private readonly baselineOverallMatchingService: BaselineOverallMatchingService,
  ) {}

  async preview(applicationId: string) {
    const application = await this.matchingRepository.findApplicationSource(applicationId);
    if (!application) throw new NotFoundException('Application not found');

    const [requirements, parseRun, pipeline] = await Promise.all([
      this.jobSkillRequirementsService.getSnapshot(application.jobVersionId),
      this.resumeParseRunsRepository.findLatestSucceededByResumeVersionId(application.resumeVersionId),
      this.matchingRepository.findActivePipelineByCodeAndType(MATCHING_BASELINE_PIPELINE_CODE, MATCHING_PIPELINE_TYPE),
    ]);
    if (!requirements) throw new NotFoundException('Application job version not found');
    if (!parseRun) throw new BadRequestException('Application resume has no successful parse result');
    if (!pipeline) throw new InternalServerErrorException('Active matching baseline pipeline is not configured');

    const skillScore = this.baselineSkillMatchingService.score(requirements.skills, parseRun.skills.map((skill) => ({ resumeSkillId: skill.id, skillId: skill.skillId, evidenceText: skill.evidenceText })));
    const experienceScore = this.baselineExperienceMatchingService.score(requirements.experienceMinMonths, requirements.experienceMaxMonths, parseRun.experiences);
    const overallScore = this.baselineOverallMatchingService.score(pipeline.config, [
      { code: 'SKILL', score: skillScore.score, status: 'SCORED' },
      { code: 'EXPERIENCE', score: experienceScore.score, status: experienceScore.status },
    ]);

    return {
      applicationId: application.id,
      jobVersionId: application.jobVersionId,
      resumeVersionId: application.resumeVersionId,
      resumeParseRunId: parseRun.id,
      pipelineVersionId: pipeline.id,
      pipelineCode: pipeline.code,
      skillScore,
      experienceScore,
      overallScore,
    };
  }
}