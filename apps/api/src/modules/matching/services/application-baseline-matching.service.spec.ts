import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { ResumeParseRunsRepository } from '../../resume-parsing/repositories/resume-parse-runs.repository';
import { ApplicationMatchRunsRepository } from '../repositories/application-match-runs.repository';
import { MatchingRepository } from '../repositories/matching.repository';
import { ApplicationBaselineMatchingService } from './application-baseline-matching.service';
import { BaselineEducationMatchingService } from './baseline-education-matching.service';
import { BaselineExperienceMatchingService } from './baseline-experience-matching.service';
import { BaselineOverallMatchingService } from './baseline-overall-matching.service';
import { BaselineSkillMatchingService } from './baseline-skill-matching.service';
import { JobSkillRequirementsService, type JobSkillRequirementSnapshot } from './job-skill-requirements.service';

interface MockApplicationSource { id: string; jobVersionId: string; resumeVersionId: string }
interface MockParseRun {
  id: string;
  skills: Array<{ id: string; skillId: string; evidenceText: string | null }>;
  experiences: Array<{ experienceMonths: number | null }>;
  educations: Array<{ degree: string | null }>;
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
    educationMinLevel: null,
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
    educations: [],
  };
}

function pipeline(): MockPipeline {
  return { id: '0198c8e8-0000-7000-8000-000000000009', code: 'matching-baseline-v1', config: { phase: 'internship', components: { skill: 0.6, experience: 0.25, education: 0.15 } } };
}

function createService(options: { application?: MockApplicationSource | null; requirements?: JobSkillRequirementSnapshot | null; parseRun?: MockParseRun | null; pipeline?: MockPipeline | null; persistError?: Error } = {}) {
  const findApplicationSource = jest.fn<(applicationId: string) => Promise<MockApplicationSource | null>>();
  const findActivePipelineByCodeAndType = jest.fn<(code: string, type: string) => Promise<MockPipeline | null>>();
  const findLatestSucceededByResumeVersionId = jest.fn<(resumeVersionId: string) => Promise<MockParseRun | null>>();
  const getSnapshot = jest.fn<(jobVersionId: string) => Promise<JobSkillRequirementSnapshot | null>>();
  const createPending = jest.fn<() => Promise<{ id: string }>>();
  const markProcessing = jest.fn<() => Promise<boolean>>();
  const persistSucceeded = jest.fn<() => Promise<void>>();
  const markFailed = jest.fn<() => Promise<boolean>>();
  const findByIdWithResult = jest.fn<() => Promise<{ id: string; status: string } | null>>();
  findApplicationSource.mockImplementation(async () => options.application === undefined ? application() : options.application);
  findActivePipelineByCodeAndType.mockImplementation(async () => options.pipeline === undefined ? pipeline() : options.pipeline);
  findLatestSucceededByResumeVersionId.mockImplementation(async () => options.parseRun === undefined ? parseRun() : options.parseRun);
  getSnapshot.mockImplementation(async () => options.requirements === undefined ? requirements() : options.requirements);
  createPending.mockImplementation(async () => ({ id: '0198c8e8-0000-7000-8000-000000000010' }));
  markProcessing.mockImplementation(async () => true);
  persistSucceeded.mockImplementation(async () => { if (options.persistError) throw options.persistError; });
  markFailed.mockImplementation(async () => true);
  findByIdWithResult.mockImplementation(async () => ({ id: '0198c8e8-0000-7000-8000-000000000010', status: 'SUCCEEDED' }));

  const service = new ApplicationBaselineMatchingService(
    { findApplicationSource, findActivePipelineByCodeAndType } as unknown as MatchingRepository,
    { findLatestSucceededByResumeVersionId } as unknown as ResumeParseRunsRepository,
    { getSnapshot } as unknown as JobSkillRequirementsService,
    { createPending, markProcessing, persistSucceeded, markFailed, findByIdWithResult } as unknown as ApplicationMatchRunsRepository,
    new BaselineSkillMatchingService(),
    new BaselineExperienceMatchingService(),
    new BaselineEducationMatchingService(),
    new BaselineOverallMatchingService(),
  );
  return { service, findApplicationSource, findActivePipelineByCodeAndType, findLatestSucceededByResumeVersionId, getSnapshot, createPending, markProcessing, persistSucceeded, markFailed, findByIdWithResult };
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

  it('includes education in the configured overall score when the job requires it', async () => {
    const required = requirements();
    required.educationMinLevel = 'BACHELOR';
    const parsed = parseRun(12);
    parsed.educations = [{ degree: 'Bachelor of Science' }];
    const result = await createService({ requirements: required, parseRun: parsed }).service.preview(application().id);

    expect(result.educationScore).toMatchObject({ score: 100, status: 'MET', requiredMinLevel: 'BACHELOR', highestCandidateLevel: 'BACHELOR' });
    expect(result.overallScore).toMatchObject({ score: 87.5, status: 'COMPLETE', scoredWeightTotal: '1' });
  });

  it('persists a succeeded match run from the exact immutable inputs', async () => {
    const { service, createPending, markProcessing, persistSucceeded, markFailed, findByIdWithResult } = createService();
    await expect(service.run(application().id)).resolves.toEqual({ id: '0198c8e8-0000-7000-8000-000000000010', status: 'SUCCEEDED' });
    expect(createPending).toHaveBeenCalledWith({ applicationId: application().id, resumeParseRunId: '0198c8e8-0000-7000-8000-000000000007', jobVersionId: application().jobVersionId, pipelineVersionId: '0198c8e8-0000-7000-8000-000000000009' });
    expect(markProcessing).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000010');
    expect(persistSucceeded).toHaveBeenCalledWith(
      '0198c8e8-0000-7000-8000-000000000010',
      application().id,
      85.29,
      expect.arrayContaining([
        expect.objectContaining({ componentCode: 'SKILL', rawScore: 100, weight: '0.705882', weightedScore: 70.588235 }),
        expect.objectContaining({ componentCode: 'EXPERIENCE', rawScore: 50, weight: '0.294118', weightedScore: 14.705882 }),
      ]),
      [{ jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000005', resumeSkillId: '0198c8e8-0000-7000-8000-000000000008', status: 'MATCHED', similarityScore: 1, evidenceText: 'TypeScript' }],
    );
    expect(markFailed).not.toHaveBeenCalled();
    expect(findByIdWithResult).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000010');
  });

  it('marks a processing run failed when persistence fails', async () => {
    const error = new Error('database write failed');
    const { service, markFailed, findByIdWithResult } = createService({ persistError: error });
    await expect(service.run(application().id)).rejects.toThrow('database write failed');
    expect(markFailed).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000010', 'MATCHING_FAILED', 'database write failed');
    expect(findByIdWithResult).not.toHaveBeenCalled();
  });

  it('rejects missing immutable matching inputs', async () => {
    await expect(createService({ application: null }).service.preview('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(createService({ requirements: null }).service.preview(application().id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(createService({ parseRun: null }).service.preview(application().id)).rejects.toBeInstanceOf(BadRequestException);
    await expect(createService({ pipeline: null }).service.preview(application().id)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
