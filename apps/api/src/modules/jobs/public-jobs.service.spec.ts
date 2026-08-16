import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { JobVersionsRepository } from './repositories/job-versions.repository';
import { JobsRepository } from './repositories/jobs.repository';
import { PublicJobsService } from './public-jobs.service';

interface MockCompany {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  companySizeMin: number | null;
  companySizeMax: number | null;
  status: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface MockJob {
  id: string;
  companyId: string;
  createdByUserId: string;
  slug: string;
  status: string;
  currentPublishedVersionId: string | null;
  firstPublishedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  company: MockCompany;
}

interface MockSkill {
  id: string;
  jobVersionId: string;
  skillId: string;
  importance: number;
  isRequired: boolean;
  weight: Prisma.Decimal;
  minExperienceMonths: number | null;
  createdAt: Date;
  skill: {
    id: string;
    name: string;
  };
}

interface MockJobVersion {
  id: string;
  jobId: string;
  versionNo: number;
  versionStatus: string;
  title: string;
  summary: string | null;
  description: string;
  responsibilities: string | null;
  benefits: string | null;
  employmentType: string | null;
  workplaceType: string | null;
  experienceMinMonths: number | null;
  experienceMaxMonths: number | null;
  salaryMin: Prisma.Decimal | null;
  salaryMax: Prisma.Decimal | null;
  salaryCurrency: string | null;
  createdByUserId: string;
  publishedAt: Date | null;
  createdAt: Date;
  skills: MockSkill[];
}

interface PublicVersionQuery {
  q?: string;
  employmentType?: string;
  workplaceType?: string;
  skillId?: string;
  skip: number;
  take: number;
}

const companyId = '0198c8e8-0000-7000-8000-000000000001';
const userId = '0198c8e8-0000-7000-8000-000000000002';
const jobId = '0198c8e8-0000-7000-8000-000000000010';
const publishedVersionId = '0198c8e8-0000-7000-8000-000000000020';
const draftVersionId = '0198c8e8-0000-7000-8000-000000000021';
const skillId = '0198c8e8-0000-7000-8000-000000000030';

function company(overrides: Partial<MockCompany> = {}): MockCompany {
  return {
    id: companyId,
    name: 'HireSense Company',
    slug: 'hiresense-company',
    description: 'Software company',
    websiteUrl: 'https://example.com',
    companySizeMin: 10,
    companySizeMax: 50,
    status: 'ACTIVE',
    createdByUserId: userId,
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    updatedAt: new Date('2026-08-16T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function job(overrides: Partial<MockJob> = {}): MockJob {
  return {
    id: jobId,
    companyId,
    createdByUserId: userId,
    slug: 'backend-developer-12345678',
    status: 'PUBLISHED',
    currentPublishedVersionId: publishedVersionId,
    firstPublishedAt: new Date('2026-08-16T01:00:00.000Z'),
    closedAt: null,
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    updatedAt: new Date('2026-08-16T01:00:00.000Z'),
    deletedAt: null,
    company: company(),
    ...overrides,
  };
}

function skill(overrides: Partial<MockSkill> = {}): MockSkill {
  return {
    id: '0198c8e8-0000-7000-8000-000000000031',
    jobVersionId: publishedVersionId,
    skillId,
    importance: 5,
    isRequired: true,
    weight: new Prisma.Decimal('1'),
    minExperienceMonths: 12,
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    skill: {
      id: skillId,
      name: 'NestJS',
    },
    ...overrides,
  };
}

function version(overrides: Partial<MockJobVersion> = {}): MockJobVersion {
  return {
    id: publishedVersionId,
    jobId,
    versionNo: 1,
    versionStatus: 'PUBLISHED',
    title: 'Backend Developer',
    summary: 'Backend position',
    description: 'Develop backend services.',
    responsibilities: null,
    benefits: null,
    employmentType: 'FULL_TIME',
    workplaceType: 'HYBRID',
    experienceMinMonths: 12,
    experienceMaxMonths: 36,
    salaryMin: new Prisma.Decimal('15000000'),
    salaryMax: new Prisma.Decimal('30000000'),
    salaryCurrency: 'VND',
    createdByUserId: userId,
    publishedAt: new Date('2026-08-16T01:00:00.000Z'),
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    skills: [skill()],
    ...overrides,
  };
}

function createMocks() {
  const findPublicPublished = jest.fn<(companyId?: string) => Promise<MockJob[]>>();
  const findPublicPublishedById = jest.fn<(id: string) => Promise<MockJob | null>>();
  const findPublicCurrentVersions = jest.fn<(versionIds: string[], query: PublicVersionQuery) => Promise<MockJobVersion[]>>();
  const countPublicCurrentVersions = jest.fn<(versionIds: string[], query: PublicVersionQuery) => Promise<number>>();
  const findPublishedByJobAndIdWithSkills = jest.fn<(jobId: string, versionId: string) => Promise<MockJobVersion | null>>();

  findPublicPublished.mockImplementation(async () => [job()]);
  findPublicPublishedById.mockImplementation(async () => job());
  findPublicCurrentVersions.mockImplementation(async () => [version()]);
  countPublicCurrentVersions.mockImplementation(async () => 1);
  findPublishedByJobAndIdWithSkills.mockImplementation(async () => version());

  const jobsRepository = {
    findPublicPublished,
    findPublicPublishedById,
  } as unknown as JobsRepository;

  const jobVersionsRepository = {
    findPublicCurrentVersions,
    countPublicCurrentVersions,
    findPublishedByJobAndIdWithSkills,
  } as unknown as JobVersionsRepository;

  const service = new PublicJobsService(jobsRepository, jobVersionsRepository);

  return {
    service,
    mocks: {
      findPublicPublished,
      findPublicPublishedById,
      findPublicCurrentVersions,
      countPublicCurrentVersions,
      findPublishedByJobAndIdWithSkills,
    },
  };
}

describe('PublicJobsService', () => {
  describe('list', () => {
    it('returns an empty result when there are no public published jobs', async () => {
      const { service, mocks } = createMocks();

      mocks.findPublicPublished.mockImplementation(async () => []);

      const result = await service.list({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      expect(mocks.findPublicCurrentVersions).not.toHaveBeenCalled();
      expect(mocks.countPublicCurrentVersions).not.toHaveBeenCalled();
    });

    it('queries only currentPublishedVersionId values from public jobs', async () => {
      const { service, mocks } = createMocks();

      const secondJob = job({
        id: '0198c8e8-0000-7000-8000-000000000011',
        slug: 'frontend-developer-12345678',
        currentPublishedVersionId: '0198c8e8-0000-7000-8000-000000000022',
      });

      const secondVersion = version({
        id: '0198c8e8-0000-7000-8000-000000000022',
        jobId: secondJob.id,
        title: 'Frontend Developer',
        skills: [],
      });

      mocks.findPublicPublished.mockImplementation(async () => [job(), secondJob]);
      mocks.findPublicCurrentVersions.mockImplementation(async () => [version(), secondVersion]);
      mocks.countPublicCurrentVersions.mockImplementation(async () => 2);

      const result = await service.list({
        page: 1,
        limit: 20,
      });

      expect(mocks.findPublicCurrentVersions).toHaveBeenCalledWith([
        publishedVersionId,
        secondJob.currentPublishedVersionId ?? '',
      ], expect.objectContaining({
        skip: 0,
        take: 20,
      }));

      expect(mocks.countPublicCurrentVersions).toHaveBeenCalledWith([
        publishedVersionId,
        secondJob.currentPublishedVersionId ?? '',
      ], expect.objectContaining({
        skip: 0,
        take: 20,
      }));

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.version.id).toBe(publishedVersionId);
      expect(result.items[1]?.version.id).toBe(secondJob.currentPublishedVersionId);
    });

    it('does not use a draft version when currentPublishedVersionId points to v1', async () => {
      const { service, mocks } = createMocks();
      const publicJob = job({
        currentPublishedVersionId: publishedVersionId,
      });

      const publishedV1 = version({
        id: publishedVersionId,
        versionNo: 1,
        versionStatus: 'PUBLISHED',
        title: 'Backend Developer v1',
      });

      mocks.findPublicPublished.mockImplementation(async () => [publicJob]);
      mocks.findPublicCurrentVersions.mockImplementation(async (versionIds) => {
        expect(versionIds).toEqual([publishedVersionId]);
        expect(versionIds).not.toContain(draftVersionId);
        return [publishedV1];
      });

      const result = await service.list({
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.version.id).toBe(publishedVersionId);
      expect(result.items[0]?.version.versionNo).toBe(1);
      expect(result.items[0]?.version.title).toBe('Backend Developer v1');
    });

    it('forwards companyId to the public jobs repository', async () => {
      const { service, mocks } = createMocks();

      await service.list({
        companyId,
        page: 1,
        limit: 20,
      });

      expect(mocks.findPublicPublished).toHaveBeenCalledWith(companyId);
    });

    it('forwards search and structured filters to the version query', async () => {
      const { service, mocks } = createMocks();

      await service.list({
        q: 'backend',
        companyId,
        employmentType: 'FULL_TIME',
        workplaceType: 'HYBRID',
        skillId,
        page: 1,
        limit: 20,
      });

      expect(mocks.findPublicCurrentVersions).toHaveBeenCalledWith(
        [publishedVersionId],
        {
          q: 'backend',
          employmentType: 'FULL_TIME',
          workplaceType: 'HYBRID',
          skillId,
          skip: 0,
          take: 20,
        },
      );

      expect(mocks.countPublicCurrentVersions).toHaveBeenCalledWith(
        [publishedVersionId],
        {
          q: 'backend',
          employmentType: 'FULL_TIME',
          workplaceType: 'HYBRID',
          skillId,
          skip: 0,
          take: 20,
        },
      );
    });

    it('calculates pagination skip and totalPages correctly', async () => {
      const { service, mocks } = createMocks();

      mocks.countPublicCurrentVersions.mockImplementation(async () => 53);

      const result = await service.list({
        page: 3,
        limit: 10,
      });

      expect(mocks.findPublicCurrentVersions).toHaveBeenCalledWith(
        [publishedVersionId],
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 53,
        totalPages: 6,
      });
    });

    it('returns totalPages zero when no current versions match filters', async () => {
      const { service, mocks } = createMocks();

      mocks.findPublicCurrentVersions.mockImplementation(async () => []);
      mocks.countPublicCurrentVersions.mockImplementation(async () => 0);

      const result = await service.list({
        q: 'does-not-exist',
        page: 1,
        limit: 20,
      });

      expect(result.items).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('pairs each returned version with the job that owns that current published version', async () => {
      const { service, mocks } = createMocks();

      const jobA = job({
        id: '0198c8e8-0000-7000-8000-000000000010',
        currentPublishedVersionId: '0198c8e8-0000-7000-8000-000000000020',
      });

      const jobB = job({
        id: '0198c8e8-0000-7000-8000-000000000011',
        slug: 'frontend-developer-12345678',
        currentPublishedVersionId: '0198c8e8-0000-7000-8000-000000000022',
      });

      const versionA = version({
        id: '0198c8e8-0000-7000-8000-000000000020',
        jobId: jobA.id,
      });

      const versionB = version({
        id: '0198c8e8-0000-7000-8000-000000000022',
        jobId: jobB.id,
        title: 'Frontend Developer',
      });

      mocks.findPublicPublished.mockImplementation(async () => [jobA, jobB]);
      mocks.findPublicCurrentVersions.mockImplementation(async () => [versionB, versionA]);
      mocks.countPublicCurrentVersions.mockImplementation(async () => 2);

      const result = await service.list({
        page: 1,
        limit: 20,
      });

      expect(result.items[0]?.job.id).toBe(jobB.id);
      expect(result.items[0]?.version.id).toBe(versionB.id);
      expect(result.items[1]?.job.id).toBe(jobA.id);
      expect(result.items[1]?.version.id).toBe(versionA.id);
    });

    it('ignores a returned version that is not mapped to a current public job', async () => {
      const { service, mocks } = createMocks();

      const unknownVersion = version({
        id: '0198c8e8-0000-7000-8000-000000000099',
        jobId: '0198c8e8-0000-7000-8000-000000000098',
      });

      mocks.findPublicCurrentVersions.mockImplementation(async () => [unknownVersion]);
      mocks.countPublicCurrentVersions.mockImplementation(async () => 1);

      const result = await service.list({
        page: 1,
        limit: 20,
      });

      expect(result.items).toEqual([]);
    });
  });

  describe('getDetail', () => {
    it('loads exactly the version referenced by currentPublishedVersionId', async () => {
      const { service, mocks } = createMocks();

      const publicJob = job({
        currentPublishedVersionId: publishedVersionId,
      });

      mocks.findPublicPublishedById.mockImplementation(async () => publicJob);
      mocks.findPublishedByJobAndIdWithSkills.mockImplementation(async (receivedJobId, versionId) => {
        expect(receivedJobId).toBe(jobId);
        expect(versionId).toBe(publishedVersionId);
        expect(versionId).not.toBe(draftVersionId);
        return version({
          id: publishedVersionId,
          versionNo: 1,
          title: 'Published v1',
        });
      });

      const result = await service.getDetail(jobId);

      expect(mocks.findPublicPublishedById).toHaveBeenCalledWith(jobId);
      expect(mocks.findPublishedByJobAndIdWithSkills).toHaveBeenCalledWith(jobId, publishedVersionId);
      expect(result.version.id).toBe(publishedVersionId);
      expect(result.version.versionNo).toBe(1);
      expect(result.version.title).toBe('Published v1');
    });

    it('returns NotFound when the job is not public', async () => {
      const { service, mocks } = createMocks();

      mocks.findPublicPublishedById.mockImplementation(async () => null);

      await expect(service.getDetail(jobId)).rejects.toBeInstanceOf(NotFoundException);

      expect(mocks.findPublishedByJobAndIdWithSkills).not.toHaveBeenCalled();
    });

    it('returns NotFound when currentPublishedVersionId is null', async () => {
      const { service, mocks } = createMocks();

      mocks.findPublicPublishedById.mockImplementation(async () => job({
        currentPublishedVersionId: null,
      }));

      await expect(service.getDetail(jobId)).rejects.toBeInstanceOf(NotFoundException);

      expect(mocks.findPublishedByJobAndIdWithSkills).not.toHaveBeenCalled();
    });

    it('returns NotFound when the referenced published version cannot be loaded', async () => {
      const { service, mocks } = createMocks();

      mocks.findPublicPublishedById.mockImplementation(async () => job());
      mocks.findPublishedByJobAndIdWithSkills.mockImplementation(async () => null);

      await expect(service.getDetail(jobId)).rejects.toBeInstanceOf(NotFoundException);

      expect(mocks.findPublishedByJobAndIdWithSkills).toHaveBeenCalledWith(jobId, publishedVersionId);
    });

    it('returns the public job and its exact published snapshot', async () => {
      const { service, mocks } = createMocks();

      const publicJob = job();
      const publishedVersion = version();

      mocks.findPublicPublishedById.mockImplementation(async () => publicJob);
      mocks.findPublishedByJobAndIdWithSkills.mockImplementation(async () => publishedVersion);

      const result = await service.getDetail(jobId);

      expect(result.job).toBe(publicJob);
      expect(result.version).toBe(publishedVersion);
      expect(result.version.versionStatus).toBe('PUBLISHED');
    });
  });
});