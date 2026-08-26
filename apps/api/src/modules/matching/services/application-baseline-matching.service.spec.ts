import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { ResumeParseRunsRepository } from '../../resume-parsing/repositories/resume-parse-runs.repository';
import { MatchingRepository } from '../repositories/matching.repository';
import { ApplicationBaselineMatchingService } from './application-baseline-matching.service';
import { BaselineExperienceMatchingService } from './baseline-experience-matching.service';
import { BaselineOverallMatchingService } from './baseline-overall-matching.service';
import { BaselineSkillMatchingService } from './baseline-skill-matching.service';
import { JobSkillRequirementsService, type JobSkillRequirementSnapshot } from './job-skill-requirements.service';

interface MockApplicationSource { id: string; jobVersionId: string; resumeVersionId: string }
interface MockParseRun {
  id: string;
  skills: Array<{ id: string; skillId: string; evidenceText: string | null }>;
  experiences: Array<{ experienceMonths: number | null }>;
}
interface MockPipeline { id: string; code: string; config: Record<string, unknown> }

function application(): MockApplicationSource {
  return { id: '0198c8e8-0000-7000-8000-000000000001', jobVersionId: '0198c8e8-0000-7000-8000-000000000002', resumeVersionId: '0198c8e8-0000-7000-8000-000000000003' };
}

function requirements(): JobSkillRequirementSnapshot {
  return {
    jobVersionId: '0198c8e8-0000-7000-8000-000000000002',
    jobId: '0198c8e8-0000-7000-8000-000000000004',
    versionNo: 1,
    versionStatus: 'PUBLISHED',
    experienceMinMonths: 24,
    experienceMaxMonths: 60,
    skills: [{
      jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000005',
      skillId: '0198c8e8-0000-7000-8000-000000000006',
      name: 'TypeScript',
      normalizedName: 'typescript',
      importance: 5,
      isRequired: true,
      weight: '1',
      minExperienceMonths: null,
    }],
  };
}

function parseRun(experienceMonths: number | null = 12): MockParseRun {
  return {
    id: '0198c8e8-0000-7000-8000-000000000007',
    skills: [{ id: '0198c8e8-0000-7000-8000-000000000008', skillId: '0198c8e8-0000-7000-8000-000000000006', evidenceText: 'TypeScript' }],
    experiences: [{ experienceMonths }],
  };
}

function pipeline(): MockPipeline {
  return { id: '0198c8e8-0000-7000-8000-000000000009', code: 'matching-baseline-v1', config: { phase: 'internship', components: { skill: 0.6, experience: 0.25, education: 0.15 } } };
}

function createService(options: { application?: MockApplicationSource | null; requirements?: JobSkillRequirementSnapshot | null; parseRun?: MockParseRun | null; pipeline?: MockPipeline | null } = {}) {
  const findApplicationSource = jest.fn<(applicationId: string) => Promise<MockApplicationSource | null>>();
  const findActivePipelineByCodeAndType = jest.fn<(code: string, type: string) => Promise<MockPipeline | null>>();
  const findLatestSucceededByResumeVersionId = jest.fn<(resumeVersionId: string) => Promise<MockParseRun | null>>();
  const getSnapshot = jest.fn<(jobVersionId: string) => Promise<JobSkillRequirementSnapshot | null>>();
  findApplicationSource.mockImplementation(async () => options.application === undefined ? application() : options.application);
  findActivePipelineByCodeAndType.mockImplementation(async () => options.pipeline === undefined ? pipeline() : options.pipeline);
  findLatestSucceededByResumeVersionId.mockImplementation(async () => options.parseRun === undefined ? parseRun() : options.parseRun);
  getSnapshot.mockImplementation(async () => options.requirements === undefined ? requirements() : options.requirements);

  const service = new ApplicationBaselineMatchingService(
    { findApplicationSource, findActivePipelineByCodeAndType } as unknown as MatchingRepository,
    { findLatestSucceededByResumeVersionId } as unknown as ResumeParseRunsRepository,
    { getSnapshot } as unknown as JobSkillRequirementsService,
    new BaselineSkillMatchingService(),
    new BaselineExperienceMatchingService(),
    new BaselineOverallMatchingService(),
  );
  return { service, findApplicationSource, findActivePipelineByCodeAndType, findLatestSucceededByResumeVersionId, getSnapshot };
}

describe('ApplicationBaselineMatchingService', () => {
  it('calculates skill, experience and overall score from the exact application snapshot', async () => {
    const { service, findActivePipelineByCodeAndType, findLatestSucceededByResumeVersionId, getSnapshot } = createService();
    await expect(service.preview('0198c8e8-0000-7000-8000-000000000001')).resolves.toMatchObject({
      applicationId: '0198c8e8-0000-7000-8000-000000000001',
      jobVersionId: '0198c8e8-0000-7000-8000-000000000002',
      resumeVersionId: '0198c8e8-0000-7000-8000-000000000003',
      resumeParseRunId: '0198c8e8-0000-7000-8000-000000000007',
      pipelineVersionId: '0198c8e8-0000-7000-8000-000000000009',
      pipelineCode: 'matching-baseline-v1',
      skillScore: { score: 100 },
      skillResults: {
        matched: [expect.objectContaining({ name: 'TypeScript', status: 'MATCHED', resumeSkillId: '0198c8e8-0000-7000-8000-000000000008', similarityScore: 1, evidenceText: 'TypeScript' })],
        missing: [],
        persistence: [{ jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000005', resumeSkillId: '0198c8e8-0000-7000-8000-000000000008', status: 'MATCHED', similarityScore: 1, evidenceText: 'TypeScript' }],
      },
      experienceScore: { score: 50, status: 'PARTIAL', knownExperienceMonths: 12 },
      overallScore: { score: 85.29, status: 'PARTIAL', scoredWeightTotal: '0.85' },
    });
    expect(getSnapshot).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000002');
    expect(findLatestSucceededByResumeVersionId).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000003');
    expect(findActivePipelineByCodeAndType).toHaveBeenCalledWith('matching-baseline-v1', 'MATCHING');
  });

  it('excludes unknown experience from the weighted score instead of treating it as zero', async () => {
    const { service } = createService({ parseRun: parseRun(null) });
    const result = await service.preview('0198c8e8-0000-7000-8000-000000000001');
    expect(result.experienceScore).toMatchObject({ score: null, status: 'UNKNOWN' });
    expect(result.overallScore).toMatchObject({ score: 100, status: 'PARTIAL', scoredWeightTotal: '0.6' });
  });

  it('rejects missing immutable matching inputs', async () => {
    await expect(createService({ application: null }).service.preview('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(createService({ requirements: null }).service.preview(application().id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(createService({ parseRun: null }).service.preview(application().id)).rejects.toBeInstanceOf(BadRequestException);
    await expect(createService({ pipeline: null }).service.preview(application().id)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
