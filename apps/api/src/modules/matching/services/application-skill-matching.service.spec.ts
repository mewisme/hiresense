import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { ResumeParseRunsRepository } from '../../resume-parsing/repositories/resume-parse-runs.repository';
import { MatchingRepository } from '../repositories/matching.repository';
import { ApplicationSkillMatchingService } from './application-skill-matching.service';
import { BaselineSkillMatchingService } from './baseline-skill-matching.service';
import { JobSkillRequirementsService, type JobSkillRequirementSnapshot } from './job-skill-requirements.service';

interface MockApplicationSource {
  id: string;
  jobVersionId: string;
  resumeVersionId: string;
}

interface MockResumeParseRun {
  id: string;
  skills: Array<{ id: string; skillId: string; evidenceText: string | null }>;
}

function application(): MockApplicationSource {
  return {
    id: '0198c8e8-0000-7000-8000-000000000001',
    jobVersionId: '0198c8e8-0000-7000-8000-000000000002',
    resumeVersionId: '0198c8e8-0000-7000-8000-000000000003',
  };
}

function requirements(): JobSkillRequirementSnapshot {
  return {
    jobVersionId: '0198c8e8-0000-7000-8000-000000000002',
    jobId: '0198c8e8-0000-7000-8000-000000000004',
    versionNo: 1,
    versionStatus: 'PUBLISHED',
    experienceMinMonths: 24,
    experienceMaxMonths: null,
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

function parseRun(): MockResumeParseRun {
  return {
    id: '0198c8e8-0000-7000-8000-000000000007',
    skills: [{
      id: '0198c8e8-0000-7000-8000-000000000008',
      skillId: '0198c8e8-0000-7000-8000-000000000006',
      evidenceText: 'TypeScript, NestJS',
    }],
  };
}

function createService(options: {
  application?: MockApplicationSource | null;
  requirements?: JobSkillRequirementSnapshot | null;
  parseRun?: MockResumeParseRun | null;
} = {}) {
  const findApplicationSource = jest.fn<(applicationId: string) => Promise<MockApplicationSource | null>>();
  const findLatestSucceededByResumeVersionId = jest.fn<(resumeVersionId: string) => Promise<MockResumeParseRun | null>>();
  const getSnapshot = jest.fn<(jobVersionId: string) => Promise<JobSkillRequirementSnapshot | null>>();
  findApplicationSource.mockImplementation(async () => options.application === undefined ? application() : options.application);
  findLatestSucceededByResumeVersionId.mockImplementation(async () => options.parseRun === undefined ? parseRun() : options.parseRun);
  getSnapshot.mockImplementation(async () => options.requirements === undefined ? requirements() : options.requirements);

  const service = new ApplicationSkillMatchingService(
    { findApplicationSource } as unknown as MatchingRepository,
    { findLatestSucceededByResumeVersionId } as unknown as ResumeParseRunsRepository,
    { getSnapshot } as unknown as JobSkillRequirementsService,
    new BaselineSkillMatchingService(),
  );

  return { service, findApplicationSource, findLatestSucceededByResumeVersionId, getSnapshot };
}

describe('ApplicationSkillMatchingService', () => {
  it('uses the application exact job and resume versions to score canonical resume skills', async () => {
    const { service, findApplicationSource, findLatestSucceededByResumeVersionId, getSnapshot } = createService();

    await expect(service.preview('0198c8e8-0000-7000-8000-000000000001')).resolves.toMatchObject({
      applicationId: '0198c8e8-0000-7000-8000-000000000001',
      jobVersionId: '0198c8e8-0000-7000-8000-000000000002',
      resumeVersionId: '0198c8e8-0000-7000-8000-000000000003',
      resumeParseRunId: '0198c8e8-0000-7000-8000-000000000007',
      skillScore: {
        score: 100,
        required: { matched: 1, missing: 0, total: 1 },
        results: [{
          jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000005',
          resumeSkillId: '0198c8e8-0000-7000-8000-000000000008',
          status: 'MATCHED',
          evidenceText: 'TypeScript, NestJS',
        }],
      },
    });

    expect(findApplicationSource).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000001');
    expect(getSnapshot).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000002');
    expect(findLatestSucceededByResumeVersionId).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000003');
  });

  it('rejects a missing application before resolving matching inputs', async () => {
    const { service, getSnapshot, findLatestSucceededByResumeVersionId } = createService({ application: null });
    await expect(service.preview('0198c8e8-0000-7000-8000-000000000099')).rejects.toBeInstanceOf(NotFoundException);
    expect(getSnapshot).not.toHaveBeenCalled();
    expect(findLatestSucceededByResumeVersionId).not.toHaveBeenCalled();
  });

  it('rejects an application whose resume has no successful parse run', async () => {
    const { service } = createService({ parseRun: null });
    await expect(service.preview('0198c8e8-0000-7000-8000-000000000001')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a missing exact job version instead of scoring against another version', async () => {
    const { service } = createService({ requirements: null });
    await expect(service.preview('0198c8e8-0000-7000-8000-000000000001')).rejects.toBeInstanceOf(NotFoundException);
  });
});
