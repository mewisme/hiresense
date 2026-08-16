import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JobCompanyMembershipsRepository } from './repositories/job-company-memberships.repository';
import { JobVersionSkillsRepository } from './repositories/job-version-skills.repository';
import { JobVersionsRepository } from './repositories/job-versions.repository';
import { JobsRepository } from './repositories/jobs.repository';
import { JobsService } from './jobs.service';

interface MockMembership {
  id: string;
  companyId: string;
  userId: string;
  role: string;
  status: string;
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
  salaryMin: null;
  salaryMax: null;
  salaryCurrency: string | null;
  createdByUserId: string;
  publishedAt: Date | null;
  createdAt: Date;
}

const companyId = '0198c8e8-0000-7000-8000-000000000001';
const userId = '0198c8e8-0000-7000-8000-000000000002';
const jobId = '0198c8e8-0000-7000-8000-000000000010';
const publishedVersionId = '0198c8e8-0000-7000-8000-000000000020';
const draftVersionId = '0198c8e8-0000-7000-8000-000000000021';

function membership(overrides: Partial<MockMembership> = {}): MockMembership {
  return {
    id: '0198c8e8-0000-7000-8000-000000000003',
    companyId,
    userId,
    role: 'RECRUITER',
    status: 'ACTIVE',
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
    summary: null,
    description: 'Description',
    responsibilities: null,
    benefits: null,
    employmentType: 'FULL_TIME',
    workplaceType: 'HYBRID',
    experienceMinMonths: null,
    experienceMaxMonths: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    createdByUserId: userId,
    publishedAt: new Date('2026-08-16T01:00:00.000Z'),
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    ...overrides,
  };
}

function createMocks() {
  const findMembership = jest.fn<(companyId: string, userId: string, db?: unknown) => Promise<MockMembership | null>>();
  const findByCompanyId = jest.fn<(companyId: string, db?: unknown) => Promise<MockJob[]>>();
  const findActiveOwnedById = jest.fn<(jobId: string, companyId: string, db?: unknown) => Promise<MockJob | null>>();
  const findDraftsByJobIds = jest.fn<(jobIds: string[], db?: unknown) => Promise<MockJobVersion[]>>();
  const findByIds = jest.fn<(ids: string[], db?: unknown) => Promise<MockJobVersion[]>>();
  const findByJobId = jest.fn<(jobId: string, db?: unknown) => Promise<MockJobVersion[]>>();
  const findLatestDraftByJobIdWithSkills = jest.fn<(jobId: string, db?: unknown) => Promise<(MockJobVersion & { skills: unknown[] }) | null>>();
  const findByJobAndIdWithSkills = jest.fn<(jobId: string, versionId: string, db?: unknown) => Promise<(MockJobVersion & { skills: unknown[] }) | null>>();

  findMembership.mockImplementation(async () => membership());
  findByCompanyId.mockImplementation(async () => [job()]);
  findDraftsByJobIds.mockImplementation(async () => []);
  findByIds.mockImplementation(async () => [version()]);
  findActiveOwnedById.mockImplementation(async () => job());
  findByJobId.mockImplementation(async () => [version()]);
  findLatestDraftByJobIdWithSkills.mockImplementation(async () => null);
  findByJobAndIdWithSkills.mockImplementation(async () => ({ ...version(), skills: [] }));

  const prisma = {} as PrismaService;

  const jobsRepository = {
    findByCompanyId,
    findActiveOwnedById,
  } as unknown as JobsRepository;

  const jobVersionsRepository = {
    findDraftsByJobIds,
    findByIds,
    findByJobId,
    findLatestDraftByJobIdWithSkills,
    findByJobAndIdWithSkills,
  } as unknown as JobVersionsRepository;

  const jobVersionSkillsRepository = {} as JobVersionSkillsRepository;

  const membershipsRepository = {
    findByCompanyAndUser: findMembership,
  } as unknown as JobCompanyMembershipsRepository;

  const service = new JobsService(prisma, jobsRepository, jobVersionsRepository, jobVersionSkillsRepository, membershipsRepository);

  return {
    service,
    mocks: {
      findMembership,
      findByCompanyId,
      findActiveOwnedById,
      findDraftsByJobIds,
      findByIds,
      findByJobId,
      findLatestDraftByJobIdWithSkills,
      findByJobAndIdWithSkills,
    },
  };
}

describe('JobsService management read', () => {
  describe('listManaged', () => {
    it('allows ACTIVE RECRUITER to list company jobs', async () => {
      const { service, mocks } = createMocks();

      const result = await service.listManaged(companyId, userId);

      expect(mocks.findMembership).toHaveBeenCalledWith(companyId, userId);
      expect(mocks.findByCompanyId).toHaveBeenCalledWith(companyId);
      expect(result).toHaveLength(1);
    });

    it('allows ACTIVE REVIEWER to list company jobs', async () => {
      const { service, mocks } = createMocks();

      mocks.findMembership.mockImplementation(async () => membership({ role: 'REVIEWER' }));

      const result = await service.listManaged(companyId, userId);

      expect(result).toHaveLength(1);
    });

    it('rejects an inactive membership', async () => {
      const { service, mocks } = createMocks();

      mocks.findMembership.mockImplementation(async () => membership({ status: 'SUSPENDED' }));

      await expect(service.listManaged(companyId, userId)).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.findByCompanyId).not.toHaveBeenCalled();
    });

    it('rejects a user without membership', async () => {
      const { service, mocks } = createMocks();

      mocks.findMembership.mockImplementation(async () => null);

      await expect(service.listManaged(companyId, userId)).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.findByCompanyId).not.toHaveBeenCalled();
    });

    it('returns empty immediately when company has no active jobs', async () => {
      const { service, mocks } = createMocks();

      mocks.findByCompanyId.mockImplementation(async () => []);

      const result = await service.listManaged(companyId, userId);

      expect(result).toEqual([]);
      expect(mocks.findDraftsByJobIds).not.toHaveBeenCalled();
      expect(mocks.findByIds).not.toHaveBeenCalled();
    });

    it('returns both current draft and current published version', async () => {
      const { service, mocks } = createMocks();

      const published = version();
      const draft = version({
        id: draftVersionId,
        versionNo: 2,
        versionStatus: 'DRAFT',
        title: 'Senior Backend Developer',
        publishedAt: null,
      });

      mocks.findDraftsByJobIds.mockImplementation(async () => [draft]);
      mocks.findByIds.mockImplementation(async () => [published]);

      const result = await service.listManaged(companyId, userId);

      expect(result[0]?.currentPublishedVersion?.id).toBe(publishedVersionId);
      expect(result[0]?.currentDraftVersion?.id).toBe(draftVersionId);
      expect(result[0]?.currentDraftVersion?.versionStatus).toBe('DRAFT');
      expect(result[0]?.currentPublishedVersion?.versionStatus).toBe('PUBLISHED');
    });

    it('uses currentPublishedVersionId instead of assuming the latest version is public', async () => {
      const { service, mocks } = createMocks();

      const draft = version({
        id: draftVersionId,
        versionNo: 2,
        versionStatus: 'DRAFT',
        publishedAt: null,
      });

      mocks.findDraftsByJobIds.mockImplementation(async () => [draft]);
      mocks.findByIds.mockImplementation(async (ids) => {
        expect(ids).toEqual([publishedVersionId]);
        expect(ids).not.toContain(draftVersionId);
        return [version()];
      });

      const result = await service.listManaged(companyId, userId);

      expect(result[0]?.currentPublishedVersion?.id).toBe(publishedVersionId);
      expect(result[0]?.currentDraftVersion?.id).toBe(draftVersionId);
    });
  });

  describe('getManagedDetail', () => {
    it('returns job, version history, current draft and published snapshot', async () => {
      const { service, mocks } = createMocks();

      const published = version();
      const draft = {
        ...version({
          id: draftVersionId,
          versionNo: 2,
          versionStatus: 'DRAFT',
          publishedAt: null,
        }),
        skills: [],
      };

      mocks.findByJobId.mockImplementation(async () => [draft, published]);
      mocks.findLatestDraftByJobIdWithSkills.mockImplementation(async () => draft);
      mocks.findByJobAndIdWithSkills.mockImplementation(async () => ({ ...published, skills: [] }));

      const result = await service.getManagedDetail(companyId, jobId, userId);

      expect(result.job.id).toBe(jobId);
      expect(result.versions).toHaveLength(2);
      expect(result.currentDraftVersion?.id).toBe(draftVersionId);
      expect(result.currentPublishedVersion?.id).toBe(publishedVersionId);
    });

    it('queries the exact currentPublishedVersionId', async () => {
      const { service, mocks } = createMocks();

      await service.getManagedDetail(companyId, jobId, userId);

      expect(mocks.findByJobAndIdWithSkills).toHaveBeenCalledWith(jobId, publishedVersionId);
    });

    it('does not query a published snapshot when currentPublishedVersionId is null', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({
        status: 'DRAFT',
        currentPublishedVersionId: null,
        firstPublishedAt: null,
      }));

      const result = await service.getManagedDetail(companyId, jobId, userId);

      expect(result.currentPublishedVersion).toBeNull();
      expect(mocks.findByJobAndIdWithSkills).not.toHaveBeenCalled();
    });

    it('returns NotFound when the job does not belong to the company', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => null);

      await expect(service.getManagedDetail(companyId, jobId, userId)).rejects.toBeInstanceOf(NotFoundException);

      expect(mocks.findByJobId).not.toHaveBeenCalled();
    });

    it('allows ACTIVE REVIEWER to view job detail', async () => {
      const { service, mocks } = createMocks();

      mocks.findMembership.mockImplementation(async () => membership({ role: 'REVIEWER' }));

      const result = await service.getManagedDetail(companyId, jobId, userId);

      expect(result.job.id).toBe(jobId);
    });

    it('rejects LEFT membership from viewing job detail', async () => {
      const { service, mocks } = createMocks();

      mocks.findMembership.mockImplementation(async () => membership({ status: 'LEFT' }));

      await expect(service.getManagedDetail(companyId, jobId, userId)).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.findActiveOwnedById).not.toHaveBeenCalled();
    });
  });
});