import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ResumeParseRunsRepository } from '../../resume-parsing/repositories/resume-parse-runs.repository';
import { MATCHING_BASELINE_PIPELINE_CODE, MATCHING_PIPELINE_TYPE } from '../constants/matching.constants';
import { mapBaselineSkillResults } from '../mappers/baseline-skill-result.mapper';
import { ApplicationMatchRunsRepository } from '../repositories/application-match-runs.repository';
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
    private readonly applicationMatchRunsRepository: ApplicationMatchRunsRepository,
    private readonly baselineSkillMatchingService: BaselineSkillMatchingService,
    private readonly baselineExperienceMatchingService: BaselineExperienceMatchingService,
    private readonly baselineOverallMatchingService: BaselineOverallMatchingService,
  ) {}

  async preview(applicationId: string) {
    return this.calculate(await this.loadInputs(applicationId));
  }

  async run(applicationId: string) {
    const inputs = await this.loadInputs(applicationId);
    const run = await this.applicationMatchRunsRepository.createPending({ applicationId: inputs.application.id, resumeParseRunId: inputs.parseRun.id, jobVersionId: inputs.application.jobVersionId, pipelineVersionId: inputs.pipeline.id });
    if (!await this.applicationMatchRunsRepository.markProcessing(run.id)) throw new InternalServerErrorException('Application match run could not be started');

    try {
      const result = this.calculate(inputs);
      if (result.overallScore.score == null) throw new Error('Application match score is unavailable');
      const components = result.overallScore.components.flatMap((component) => {
        if (component.score == null || component.weightedScore == null) return [];
        const details = component.code === 'SKILL'
          ? { formulaVersion: result.skillScore.formulaVersion, status: component.status, configuredWeight: component.configuredWeight, matchedWeight: result.skillScore.matchedWeight, totalWeight: result.skillScore.totalWeight, required: result.skillScore.required, preferred: result.skillScore.preferred }
          : component.code === 'EXPERIENCE'
            ? { formulaVersion: result.experienceScore.formulaVersion, status: result.experienceScore.status, configuredWeight: component.configuredWeight, requiredMinMonths: result.experienceScore.requiredMinMonths, preferredMaxMonths: result.experienceScore.preferredMaxMonths, knownExperienceMonths: result.experienceScore.knownExperienceMonths, quantifiedEntryCount: result.experienceScore.quantifiedEntryCount, unknownEntryCount: result.experienceScore.unknownEntryCount }
            : { status: component.status, configuredWeight: component.configuredWeight };
        return [{ componentCode: component.code, rawScore: component.score, weight: component.effectiveWeight, weightedScore: component.weightedScore, details }];
      });
      await this.applicationMatchRunsRepository.persistSucceeded(run.id, inputs.application.id, result.overallScore.score, components, result.skillResults.persistence);
    } catch (error) {
      await this.applicationMatchRunsRepository.markFailed(run.id, 'MATCHING_FAILED', error instanceof Error ? error.message : 'Unknown matching error');
      throw error;
    }

    const persisted = await this.applicationMatchRunsRepository.findByIdWithResult(run.id);
    if (!persisted) throw new InternalServerErrorException('Application match run result could not be loaded');
    return persisted;
  }

  private async loadInputs(applicationId: string) {
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
    return { application, requirements, parseRun, pipeline };
  }

  private calculate({ application, requirements, parseRun, pipeline }: Awaited<ReturnType<ApplicationBaselineMatchingService['loadInputs']>>) {
    const skillScore = this.baselineSkillMatchingService.score(requirements.skills, parseRun.skills.map((skill) => ({ resumeSkillId: skill.id, skillId: skill.skillId, evidenceText: skill.evidenceText })));
    const skillResults = mapBaselineSkillResults(requirements.skills, skillScore);
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
      skillResults,
      experienceScore,
      overallScore,
    };
  }
}