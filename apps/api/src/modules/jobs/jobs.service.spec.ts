import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
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
  salaryMin: Prisma.Decimal | null;
  salaryMax: Prisma.Decimal | null;
  salaryCurrency: string | null;
  createdByUserId: string;
  publishedAt: Date | null;
  createdAt: Date;
}

interface MockSkill {
  id: string;
  jobVersionId: string;
  skillId: string;
  importance: number;
  isRequired: boolean;
  weight: Prisma.Decimal;
  minExperienceMonths: number | null;
  skill: {
    id: string;
    name: string;
  };
}

function membership(overrides: Partial<MockMembership> = {}): MockMembership {
  return {
    id: 'membership-1',
    companyId: '0198c8e8-0000-7000-8000-000000000001',
    userId: '0198c8e8-0000-7000-8000-000000000002',
    role: 'RECRUITER',
    status: 'ACTIVE',
    ...overrides,
  };
}

function job(overrides: Partial<MockJob> = {}): MockJob {
  return {
    id: '0198c8e8-0000-7000-8000-000000000010',
    companyId: '0198c8e8-0000-7000-8000-000000000001',
    createdByUserId: '0198c8e8-0000-7000-8000-000000000002',
    slug: 'backend-developer-12345678',
    status: 'DRAFT',
    currentPublishedVersionId: null,
    firstPublishedAt: null,
    closedAt: null,
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    updatedAt: new Date('2026-08-16T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function version(overrides: Partial<MockJobVersion> = {}): MockJobVersion {
  return {
    id: '0198c8e8-0000-7000-8000-000000000020',
    jobId: '0198c8e8-0000-7000-8000-000000000010',
    versionNo: 1,
    versionStatus: 'DRAFT',
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
    createdByUserId: '0198c8e8-0000-7000-8000-000000000002',
    publishedAt: null,
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    ...overrides,
  };
}

function skill(overrides: Partial<MockSkill> = {}): MockSkill {
  return {
    id: '0198c8e8-0000-7000-8000-000000000030',
    jobVersionId: '0198c8e8-0000-7000-8000-000000000020',
    skillId: '0198c8e8-0000-7000-8000-000000000031',
    importance: 5,
    isRequired: true,
    weight: new Prisma.Decimal('1'),
    minExperienceMonths: 12,
    skill: {
      id: '0198c8e8-0000-7000-8000-000000000031',
      name: 'NestJS',
    },
    ...overrides,
  };
}

function createMocks() {
  const tx = {};

  const transaction = jest.fn<(callback: (client: unknown) => Promise<unknown>) => Promise<unknown>>();
  transaction.mockImplementation(async (callback) => callback(tx));

  const findMembership = jest.fn<(companyId: string, userId: string, db?: unknown) => Promise<MockMembership | null>>();
  const createJob = jest.fn<(input: unknown, db?: unknown) => Promise<MockJob>>();
  const lockActiveOwnedById = jest.fn<(id: string, companyId: string, db: unknown) => Promise<boolean>>();
  const findActiveOwnedById = jest.fn<(id: string, companyId: string, db?: unknown) => Promise<MockJob | null>>();
  const publishJob = jest.fn<(id: string, versionId: string, publishedAt: Date, firstPublishedAt: Date, db?: unknown) => Promise<MockJob>>();
  const pausePublished = jest.fn<(id: string, db?: unknown) => Promise<{ count: number }>>();
  const closePublishedOrPaused = jest.fn<(id: string, closedAt: Date, db?: unknown) => Promise<{ count: number }>>();
  const reopenPausedOrClosed = jest.fn<(id: string, db?: unknown) => Promise<{ count: number }>>();
  const archiveDraftOrClosed = jest.fn<(id: string, db?: unknown) => Promise<{ count: number }>>();
  const softDeleteDraftClosedOrArchived = jest.fn<(id: string, deletedAt: Date, db?: unknown) => Promise<{ count: number }>>();

  const createVersion = jest.fn<(input: unknown, db?: unknown) => Promise<MockJobVersion>>();
  const findLatestByJobId = jest.fn<(jobId: string, db?: unknown) => Promise<MockJobVersion | null>>();
  const findLatestDraftByJobId = jest.fn<(jobId: string, db?: unknown) => Promise<MockJobVersion | null>>();
  const getNextVersionNo = jest.fn<(jobId: string, db?: unknown) => Promise<number>>();
  const updateDraft = jest.fn<(id: string, input: unknown, db?: unknown) => Promise<{ count: number }>>();
  const publishDraft = jest.fn<(id: string, publishedAt: Date, db?: unknown) => Promise<{ count: number }>>();
  const findByIdWithSkills = jest.fn<(id: string, db?: unknown) => Promise<(MockJobVersion & { skills: MockSkill[] }) | null>>();

  const findActiveSkillIds = jest.fn<(skillIds: string[], db?: unknown) => Promise<string[]>>();
  const createManySkills = jest.fn<(inputs: unknown[], db?: unknown) => Promise<{ count: number }>>();
  const findSkillsByVersionId = jest.fn<(jobVersionId: string, db?: unknown) => Promise<MockSkill[]>>();
  const deleteSkillsByVersionId = jest.fn<(jobVersionId: string, db?: unknown) => Promise<{ count: number }>>();

  findMembership.mockImplementation(async () => membership());
  createJob.mockImplementation(async () => job());
  lockActiveOwnedById.mockImplementation(async () => true);
  findActiveOwnedById.mockImplementation(async () => job());
  createVersion.mockImplementation(async () => version());
  findActiveSkillIds.mockImplementation(async (ids) => ids);
  createManySkills.mockImplementation(async (inputs) => ({ count: inputs.length }));
  findSkillsByVersionId.mockImplementation(async () => [skill()]);
  deleteSkillsByVersionId.mockImplementation(async () => ({ count: 1 }));
  updateDraft.mockImplementation(async () => ({ count: 1 }));
  publishDraft.mockImplementation(async () => ({ count: 1 }));
  pausePublished.mockImplementation(async () => ({ count: 1 }));
  closePublishedOrPaused.mockImplementation(async () => ({ count: 1 }));
  reopenPausedOrClosed.mockImplementation(async () => ({ count: 1 }));
  archiveDraftOrClosed.mockImplementation(async () => ({ count: 1 }));
  softDeleteDraftClosedOrArchived.mockImplementation(async () => ({ count: 1 }));

  const prisma = { $transaction: transaction } as unknown as PrismaService;

  const jobsRepository = {
    create: createJob,
    lockActiveOwnedById,
    findActiveOwnedById,
    publish: publishJob,
    pausePublished,
    closePublishedOrPaused,
    reopenPausedOrClosed,
    archiveDraftOrClosed,
    softDeleteDraftClosedOrArchived,
  } as unknown as JobsRepository;

  const jobVersionsRepository = {
    create: createVersion,
    findLatestByJobId,
    findLatestDraftByJobId,
    getNextVersionNo,
    updateDraft,
    publishDraft,
    findByIdWithSkills,
  } as unknown as JobVersionsRepository;

  const jobVersionSkillsRepository = {
    findActiveSkillIds,
    createMany: createManySkills,
    findByJobVersionId: findSkillsByVersionId,
    deleteByJobVersionId: deleteSkillsByVersionId,
  } as unknown as JobVersionSkillsRepository;

  const membershipsRepository = {
    findByCompanyAndUser: findMembership,
  } as unknown as JobCompanyMembershipsRepository;

  const service = new JobsService(prisma, jobsRepository, jobVersionsRepository, jobVersionSkillsRepository, membershipsRepository);

  return {
    tx,
    service,
    mocks: {
      transaction,
      findMembership,
      createJob,
      lockActiveOwnedById,
      findActiveOwnedById,
      publishJob,
      pausePublished,
      closePublishedOrPaused,
      reopenPausedOrClosed,
      archiveDraftOrClosed,
      softDeleteDraftClosedOrArchived,
      createVersion,
      findLatestByJobId,
      findLatestDraftByJobId,
      getNextVersionNo,
      updateDraft,
      publishDraft,
      findByIdWithSkills,
      findActiveSkillIds,
      createManySkills,
      findSkillsByVersionId,
      deleteSkillsByVersionId,
    },
  };
}

const companyId = '0198c8e8-0000-7000-8000-000000000001';
const userId = '0198c8e8-0000-7000-8000-000000000002';
const jobId = '0198c8e8-0000-7000-8000-000000000010';
const skillId = '0198c8e8-0000-7000-8000-000000000031';

describe('JobsService', () => {
  describe('create', () => {
    it('creates Job, v1 DRAFT and skills in one transaction', async () => {
      const { tx, service, mocks } = createMocks();

      const result = await service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Develop backend services.',
        employmentType: 'FULL_TIME',
        workplaceType: 'HYBRID',
        experienceMinMonths: 12,
        experienceMaxMonths: 36,
        salaryMin: '15000000',
        salaryMax: '30000000',
        salaryCurrency: 'VND',
        skills: [{
          skillId,
          importance: 5,
          isRequired: true,
          weight: '1',
          minExperienceMonths: 12,
        }],
      });

      expect(mocks.transaction).toHaveBeenCalledTimes(1);
      expect(mocks.findMembership).toHaveBeenCalledWith(companyId, userId, tx);
      expect(mocks.findActiveSkillIds).toHaveBeenCalledWith([skillId], tx);

      expect(mocks.createJob).toHaveBeenCalledWith(expect.objectContaining({
        companyId,
        createdByUserId: userId,
        status: 'DRAFT',
      }), tx);

      expect(mocks.createVersion).toHaveBeenCalledWith(expect.objectContaining({
        jobId,
        versionNo: 1,
        title: 'Backend Developer',
        description: 'Develop backend services.',
        createdByUserId: userId,
      }), tx);

      expect(mocks.createManySkills).toHaveBeenCalledWith([expect.objectContaining({
        jobVersionId: version().id,
        skillId,
        importance: 5,
        isRequired: true,
        minExperienceMonths: 12,
      })], tx);

      expect(result.job.status).toBe('DRAFT');
      expect(result.version.versionNo).toBe(1);
    });

    it('rejects a user without an ACTIVE manage membership', async () => {
      const { service, mocks } = createMocks();

      mocks.findMembership.mockImplementation(async () => membership({ status: 'SUSPENDED' }));

      await expect(service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Description',
      })).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.createJob).not.toHaveBeenCalled();
      expect(mocks.createVersion).not.toHaveBeenCalled();
    });

    it('rejects REVIEWER from creating jobs', async () => {
      const { service, mocks } = createMocks();

      mocks.findMembership.mockImplementation(async () => membership({ role: 'REVIEWER' }));

      await expect(service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Description',
      })).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.createJob).not.toHaveBeenCalled();
    });

    it('rejects duplicate skills', async () => {
      const { service, mocks } = createMocks();

      await expect(service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Description',
        skills: [{ skillId }, { skillId }],
      })).rejects.toThrow('Duplicate skills are not allowed');

      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.createJob).not.toHaveBeenCalled();
    });

    it('rejects inactive or missing skills', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveSkillIds.mockImplementation(async () => []);

      await expect(service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Description',
        skills: [{ skillId }],
      })).rejects.toThrow('One or more job skills do not exist or are inactive');

      expect(mocks.createJob).not.toHaveBeenCalled();
    });

    it('rejects invalid experience range', async () => {
      const { service, mocks } = createMocks();

      await expect(service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Description',
        experienceMinMonths: 36,
        experienceMaxMonths: 12,
      })).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.transaction).not.toHaveBeenCalled();
    });

    it('rejects invalid salary range', async () => {
      const { service, mocks } = createMocks();

      await expect(service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Description',
        salaryMin: '30000000',
        salaryMax: '15000000',
        salaryCurrency: 'VND',
      })).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.transaction).not.toHaveBeenCalled();
    });

    it('requires salaryCurrency when salary is present', async () => {
      const { service, mocks } = createMocks();

      await expect(service.create(companyId, userId, {
        title: 'Backend Developer',
        description: 'Description',
        salaryMin: '15000000',
      })).rejects.toThrow('salaryCurrency is required when salary range is provided');

      expect(mocks.transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates the existing DRAFT without creating a new version', async () => {
      const { tx, service, mocks } = createMocks();
      const draft = version();

      mocks.findActiveOwnedById.mockImplementation(async () => job());
      mocks.findLatestByJobId.mockImplementation(async () => draft);
      mocks.findByIdWithSkills.mockImplementation(async () => ({
        ...draft,
        title: 'Senior Backend Developer',
        skills: [skill()],
      }));

      const result = await service.update(companyId, jobId, userId, {
        title: 'Senior Backend Developer',
      });

      expect(mocks.lockActiveOwnedById).toHaveBeenCalledWith(jobId, companyId, tx);
      expect(mocks.updateDraft).toHaveBeenCalledWith(draft.id, expect.objectContaining({
        title: 'Senior Backend Developer',
      }), tx);
      expect(mocks.createVersion).not.toHaveBeenCalled();
      expect(result.createdNewVersion).toBe(false);
      expect(result.version.title).toBe('Senior Backend Developer');
    });

    it('creates v2 DRAFT when latest version is PUBLISHED', async () => {
      const { tx, service, mocks } = createMocks();
      const published = version({
        versionStatus: 'PUBLISHED',
        publishedAt: new Date('2026-08-16T01:00:00.000Z'),
      });

      const v2 = version({
        id: '0198c8e8-0000-7000-8000-000000000021',
        versionNo: 2,
        title: 'Senior Backend Developer',
      });

      mocks.findActiveOwnedById.mockImplementation(async () => job({
        status: 'PUBLISHED',
        currentPublishedVersionId: published.id,
      }));
      mocks.findLatestByJobId.mockImplementation(async () => published);
      mocks.getNextVersionNo.mockImplementation(async () => 2);
      mocks.createVersion.mockImplementation(async () => v2);
      mocks.findByIdWithSkills.mockImplementation(async () => ({ ...v2, skills: [skill({ jobVersionId: v2.id })] }));

      const result = await service.update(companyId, jobId, userId, {
        title: 'Senior Backend Developer',
      });

      expect(mocks.getNextVersionNo).toHaveBeenCalledWith(jobId, tx);
      expect(mocks.createVersion).toHaveBeenCalledWith(expect.objectContaining({
        jobId,
        versionNo: 2,
        title: 'Senior Backend Developer',
        createdByUserId: userId,
      }), tx);

      expect(mocks.findSkillsByVersionId).toHaveBeenCalledWith(published.id, tx);
      expect(mocks.createManySkills).toHaveBeenCalled();
      expect(mocks.updateDraft).not.toHaveBeenCalled();
      expect(result.createdNewVersion).toBe(true);
      expect(result.version.versionNo).toBe(2);
    });

    it('replaces draft skills when skills are explicitly provided', async () => {
      const { tx, service, mocks } = createMocks();
      const draft = version();

      mocks.findActiveOwnedById.mockImplementation(async () => job());
      mocks.findLatestByJobId.mockImplementation(async () => draft);
      mocks.findByIdWithSkills.mockImplementation(async () => ({ ...draft, skills: [] }));

      await service.update(companyId, jobId, userId, {
        skills: [{
          skillId,
          importance: 4,
          isRequired: false,
          weight: '0.5',
        }],
      });

      expect(mocks.findActiveSkillIds).toHaveBeenCalledWith([skillId], tx);
      expect(mocks.deleteSkillsByVersionId).toHaveBeenCalledWith(draft.id, tx);
      expect(mocks.createManySkills).toHaveBeenCalledWith([expect.objectContaining({
        jobVersionId: draft.id,
        skillId,
        importance: 4,
        isRequired: false,
      })], tx);
    });

    it('rejects an empty PATCH payload', async () => {
      const { service, mocks } = createMocks();

      await expect(service.update(companyId, jobId, userId, {})).rejects.toThrow('At least one job field must be provided');

      expect(mocks.transaction).not.toHaveBeenCalled();
    });

    it('rejects editing an archived job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'ARCHIVED' }));

      await expect(service.update(companyId, jobId, userId, {
        title: 'Updated',
      })).rejects.toThrow('Archived job cannot be edited');

      expect(mocks.findLatestByJobId).not.toHaveBeenCalled();
    });

    it('returns NotFound when job ownership does not match the company', async () => {
      const { service, mocks } = createMocks();

      mocks.lockActiveOwnedById.mockImplementation(async () => false);

      await expect(service.update(companyId, jobId, userId, {
        title: 'Updated',
      })).rejects.toBeInstanceOf(NotFoundException);

      expect(mocks.findLatestByJobId).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('publishes the latest DRAFT and updates currentPublishedVersionId', async () => {
      const { tx, service, mocks } = createMocks();
      const draft = version();

      mocks.findActiveOwnedById.mockImplementation(async () => job());
      mocks.findLatestDraftByJobId.mockImplementation(async () => draft);
      mocks.findLatestByJobId.mockImplementation(async () => draft);
      mocks.publishJob.mockImplementation(async (_id, versionId, publishedAt, firstPublishedAt) => job({
        status: 'PUBLISHED',
        currentPublishedVersionId: versionId,
        firstPublishedAt,
        closedAt: null,
        updatedAt: publishedAt,
      }));
      mocks.findByIdWithSkills.mockImplementation(async () => ({
        ...draft,
        versionStatus: 'PUBLISHED',
        publishedAt: new Date(),
        skills: [skill()],
      }));

      const result = await service.publish(companyId, jobId, userId);

      expect(mocks.publishDraft).toHaveBeenCalledWith(draft.id, expect.any(Date), tx);
      expect(mocks.publishJob).toHaveBeenCalledWith(
        jobId,
        draft.id,
        expect.any(Date),
        expect.any(Date),
        tx,
      );
      expect(result.job.status).toBe('PUBLISHED');
      expect(result.job.currentPublishedVersionId).toBe(draft.id);
    });

    it('preserves firstPublishedAt when publishing a later version', async () => {
      const { service, mocks } = createMocks();
      const firstPublishedAt = new Date('2026-08-15T10:00:00.000Z');
      const draftV2 = version({
        id: '0198c8e8-0000-7000-8000-000000000021',
        versionNo: 2,
      });

      mocks.findActiveOwnedById.mockImplementation(async () => job({
        status: 'PUBLISHED',
        currentPublishedVersionId: version().id,
        firstPublishedAt,
      }));
      mocks.findLatestDraftByJobId.mockImplementation(async () => draftV2);
      mocks.findLatestByJobId.mockImplementation(async () => draftV2);
      mocks.publishJob.mockImplementation(async (_id, versionId, _publishedAt, firstPublished) => job({
        status: 'PUBLISHED',
        currentPublishedVersionId: versionId,
        firstPublishedAt: firstPublished,
      }));
      mocks.findByIdWithSkills.mockImplementation(async () => ({
        ...draftV2,
        versionStatus: 'PUBLISHED',
        publishedAt: new Date(),
        skills: [],
      }));

      await service.publish(companyId, jobId, userId);

      expect(mocks.publishJob).toHaveBeenCalledWith(
        jobId,
        draftV2.id,
        expect.any(Date),
        firstPublishedAt,
        expect.anything(),
      );
    });

    it('rejects publishing when there is no draft', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'PUBLISHED' }));
      mocks.findLatestDraftByJobId.mockImplementation(async () => null);

      await expect(service.publish(companyId, jobId, userId)).rejects.toThrow('Job has no draft version to publish');

      expect(mocks.publishDraft).not.toHaveBeenCalled();
      expect(mocks.publishJob).not.toHaveBeenCalled();
    });

    it('rejects publishing a CLOSED job before reopen', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'CLOSED' }));

      await expect(service.publish(companyId, jobId, userId)).rejects.toThrow('Closed job must be reopened before publishing');

      expect(mocks.findLatestDraftByJobId).not.toHaveBeenCalled();
    });

    it('rejects publishing an ARCHIVED job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'ARCHIVED' }));

      await expect(service.publish(companyId, jobId, userId)).rejects.toThrow('Archived job cannot be published');

      expect(mocks.publishDraft).not.toHaveBeenCalled();
    });
  });

  describe('lifecycle', () => {
    it('pauses a PUBLISHED job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById
        .mockImplementationOnce(async () => job({ status: 'PUBLISHED', currentPublishedVersionId: version().id }))
        .mockImplementationOnce(async () => job({ status: 'PAUSED', currentPublishedVersionId: version().id }));

      const result = await service.pause(companyId, jobId, userId);

      expect(mocks.pausePublished).toHaveBeenCalledWith(jobId, expect.anything());
      expect(result.status).toBe('PAUSED');
    });

    it('rejects pausing a DRAFT job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'DRAFT' }));

      await expect(service.pause(companyId, jobId, userId)).rejects.toThrow('Only a published job can be paused');

      expect(mocks.pausePublished).not.toHaveBeenCalled();
    });

    it('closes a PUBLISHED job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById
        .mockImplementationOnce(async () => job({ status: 'PUBLISHED' }))
        .mockImplementationOnce(async () => job({
          status: 'CLOSED',
          closedAt: new Date('2026-08-16T02:00:00.000Z'),
        }));

      const result = await service.close(companyId, jobId, userId);

      expect(mocks.closePublishedOrPaused).toHaveBeenCalledWith(jobId, expect.any(Date), expect.anything());
      expect(result.status).toBe('CLOSED');
    });

    it('closes a PAUSED job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById
        .mockImplementationOnce(async () => job({ status: 'PAUSED' }))
        .mockImplementationOnce(async () => job({ status: 'CLOSED', closedAt: new Date() }));

      const result = await service.close(companyId, jobId, userId);

      expect(result.status).toBe('CLOSED');
    });

    it('reopens a CLOSED job with an existing published version', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById
        .mockImplementationOnce(async () => job({
          status: 'CLOSED',
          currentPublishedVersionId: version().id,
          closedAt: new Date(),
        }))
        .mockImplementationOnce(async () => job({
          status: 'PUBLISHED',
          currentPublishedVersionId: version().id,
          closedAt: null,
        }));

      const result = await service.reopen(companyId, jobId, userId);

      expect(mocks.reopenPausedOrClosed).toHaveBeenCalledWith(jobId, expect.anything());
      expect(result.status).toBe('PUBLISHED');
      expect(result.closedAt).toBeNull();
    });

    it('rejects reopening when no published version exists', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({
        status: 'CLOSED',
        currentPublishedVersionId: null,
      }));

      await expect(service.reopen(companyId, jobId, userId)).rejects.toThrow('Job has no published version to reopen');

      expect(mocks.reopenPausedOrClosed).not.toHaveBeenCalled();
    });

    it('archives a DRAFT job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById
        .mockImplementationOnce(async () => job({ status: 'DRAFT' }))
        .mockImplementationOnce(async () => job({ status: 'ARCHIVED' }));

      const result = await service.archive(companyId, jobId, userId);

      expect(mocks.archiveDraftOrClosed).toHaveBeenCalledWith(jobId, expect.anything());
      expect(result.status).toBe('ARCHIVED');
    });

    it('archives a CLOSED job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById
        .mockImplementationOnce(async () => job({ status: 'CLOSED' }))
        .mockImplementationOnce(async () => job({ status: 'ARCHIVED' }));

      const result = await service.archive(companyId, jobId, userId);

      expect(result.status).toBe('ARCHIVED');
    });

    it('rejects archiving a PUBLISHED job', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'PUBLISHED' }));

      await expect(service.archive(companyId, jobId, userId)).rejects.toThrow('Only a draft or closed job can be archived');

      expect(mocks.archiveDraftOrClosed).not.toHaveBeenCalled();
    });

    it('soft deletes a DRAFT job without deleting versions', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'DRAFT' }));

      const result = await service.delete(companyId, jobId, userId);

      expect(mocks.softDeleteDraftClosedOrArchived).toHaveBeenCalledWith(jobId, expect.any(Date), expect.anything());
      expect(result.id).toBe(jobId);
      expect(result.status).toBe('ARCHIVED');
      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(mocks.createVersion).not.toHaveBeenCalled();
    });

    it('rejects deleting a PUBLISHED job before close', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'PUBLISHED' }));

      await expect(service.delete(companyId, jobId, userId)).rejects.toThrow('Published or paused job must be closed before deletion');

      expect(mocks.softDeleteDraftClosedOrArchived).not.toHaveBeenCalled();
    });

    it('rejects deleting a PAUSED job before close', async () => {
      const { service, mocks } = createMocks();

      mocks.findActiveOwnedById.mockImplementation(async () => job({ status: 'PAUSED' }));

      await expect(service.delete(companyId, jobId, userId)).rejects.toThrow('Published or paused job must be closed before deletion');

      expect(mocks.softDeleteDraftClosedOrArchived).not.toHaveBeenCalled();
    });
  });
});