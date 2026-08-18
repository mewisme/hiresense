import { BadRequestException, ConflictException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { Readable } from 'node:stream';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { ApplicationsService } from './applications.service';
import { ApplicationCandidatesRepository } from './repositories/application-candidates.repository';
import { ApplicationCompanyMembershipsRepository } from './repositories/application-company-memberships.repository';
import { ApplicationJobsRepository } from './repositories/application-jobs.repository';
import { ApplicationStageHistoryRepository } from './repositories/application-stage-history.repository';
import { ApplicationsRepository } from './repositories/applications.repository';
import { RecruitmentStagesRepository } from './repositories/recruitment-stages.repository';
import type { SystemRecruitmentStageCode } from './types/recruitment-stage.type';

const NOW = new Date('2026-08-18T00:00:00.000Z');

interface MockStage {
  id: string;
  companyId: string | null;
  code: string;
  name: string;
  ordinal: number;
  isTerminal: boolean;
  terminalOutcome: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockApplication {
  id: string;
  jobId: string;
  jobVersionId: string;
  candidateProfileId: string;
  resumeVersionId: string;
  currentStageId: string;
  currentMatchRunId: string | null;
  source: string;
  coverLetter: string | null;
  appliedAt: Date;
  withdrawnAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockApplicationWithStage extends MockApplication {
  currentStage: MockStage;
}

interface MockMembership {
  role: string;
  status: string;
}

function stage(code: SystemRecruitmentStageCode, overrides: Partial<MockStage> = {}): MockStage {
  const terminal = code === 'HIRED' || code === 'REJECTED' || code === 'WITHDRAWN';
  return {
    id: `stage-${code.toLowerCase()}`,
    companyId: null,
    code,
    name: code,
    ordinal: 1,
    isTerminal: terminal,
    terminalOutcome: terminal ? code : null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function application(overrides: Partial<MockApplication> = {}): MockApplication {
  return {
    id: 'application-1',
    jobId: 'job-1',
    jobVersionId: 'job-version-1',
    candidateProfileId: 'candidate-1',
    resumeVersionId: 'resume-version-1',
    currentStageId: 'stage-applied',
    currentMatchRunId: null,
    source: 'DIRECT',
    coverLetter: null,
    appliedAt: NOW,
    withdrawnAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function applicationWithStage(code: SystemRecruitmentStageCode, overrides: Partial<MockApplication> = {}): MockApplicationWithStage {
  const currentStage = stage(code);
  return {
    ...application({ currentStageId: currentStage.id, ...overrides }),
    currentStage,
  };
}

function createMocks() {
  const tx = { id: 'tx' };
  const transaction = jest.fn<(callback: (client: unknown) => Promise<unknown>) => Promise<unknown>>();
  transaction.mockImplementation(async (callback) => callback(tx));

  const findProfileByUserId = jest.fn<(userId: string, db?: unknown) => Promise<{ id: string } | null>>();
  const lockOwnedResumeVersion = jest.fn<(candidateProfileId: string, resumeVersionId: string, db: unknown) => Promise<boolean>>();
  findProfileByUserId.mockImplementation(async () => ({ id: 'candidate-1' }));
  lockOwnedResumeVersion.mockImplementation(async () => true);

  const findMembership = jest.fn<(companyId: string, userId: string, db?: unknown) => Promise<MockMembership | null>>();
  findMembership.mockImplementation(async () => ({ role: 'RECRUITER', status: 'ACTIVE' }));

  const lockPublishedById = jest.fn<(jobId: string, db: unknown) => Promise<{ id: string; currentPublishedVersionId: string } | null>>();
  const findCompanyJobById = jest.fn<(jobId: string, companyId: string, db?: unknown) => Promise<{ id: string } | null>>();
  lockPublishedById.mockImplementation(async () => ({ id: 'job-1', currentPublishedVersionId: 'job-version-1' }));
  findCompanyJobById.mockImplementation(async () => ({ id: 'job-1' }));

  const findByJobAndCandidate = jest.fn<(jobId: string, candidateProfileId: string, db?: unknown) => Promise<MockApplication | null>>();
  const createApplication = jest.fn<(input: unknown, db?: unknown) => Promise<MockApplication>>();
  const findByCandidateProfileId = jest.fn<(candidateProfileId: string, db?: unknown) => Promise<MockApplication[]>>();
  const findCandidateOwnedByIdWithDetail = jest.fn<(id: string, candidateProfileId: string, db?: unknown) => Promise<MockApplication | null>>();
  const lockCandidateOwnedById = jest.fn<(id: string, candidateProfileId: string, db: unknown) => Promise<boolean>>();
  const findCandidateOwnedByIdWithStage = jest.fn<(id: string, candidateProfileId: string, db?: unknown) => Promise<MockApplicationWithStage | null>>();
  const withdrawApplication = jest.fn<(id: string, currentStageId: string, withdrawnAt: Date, db?: unknown) => Promise<MockApplication>>();
  const findRecruiterApplications = jest.fn<(jobId: string, companyId: string, query: unknown, db?: unknown) => Promise<MockApplication[]>>();
  const countRecruiterApplications = jest.fn<(jobId: string, companyId: string, query: unknown, db?: unknown) => Promise<number>>();
  const findRecruiterOwnedByIdWithDetail = jest.fn<(id: string, companyId: string, db?: unknown) => Promise<MockApplication | null>>();
  const lockRecruiterOwnedById = jest.fn<(id: string, companyId: string, db: unknown) => Promise<boolean>>();
  const findRecruiterOwnedByIdWithStage = jest.fn<(id: string, companyId: string, db?: unknown) => Promise<MockApplicationWithStage | null>>();
  const updateCurrentStage = jest.fn<(id: string, currentStageId: string, db?: unknown) => Promise<MockApplication>>();
  const findRecruiterResumeTarget = jest.fn<(id: string, companyId: string, db?: unknown) => Promise<{
    id: string;
    resumeVersionId: string;
    resumeVersion: {
      id: string;
      versionNo: number;
      fileObjectId: string;
      resume: { id: string; name: string };
    };
  } | null>>();

  findByJobAndCandidate.mockImplementation(async () => null);
  createApplication.mockImplementation(async () => application());
  findByCandidateProfileId.mockImplementation(async () => [application()]);
  findCandidateOwnedByIdWithDetail.mockImplementation(async () => application());
  lockCandidateOwnedById.mockImplementation(async () => true);
  findCandidateOwnedByIdWithStage.mockImplementation(async () => applicationWithStage('APPLIED'));
  withdrawApplication.mockImplementation(async (_id, currentStageId, withdrawnAt) => application({ currentStageId, withdrawnAt }));
  findRecruiterApplications.mockImplementation(async () => []);
  countRecruiterApplications.mockImplementation(async () => 0);
  findRecruiterOwnedByIdWithDetail.mockImplementation(async () => application());
  lockRecruiterOwnedById.mockImplementation(async () => true);
  findRecruiterOwnedByIdWithStage.mockImplementation(async () => applicationWithStage('APPLIED'));
  updateCurrentStage.mockImplementation(async (_id, currentStageId) => application({ currentStageId }));
  findRecruiterResumeTarget.mockImplementation(async () => ({
    id: 'application-1',
    resumeVersionId: 'resume-version-1',
    resumeVersion: {
      id: 'resume-version-1',
      versionNo: 1,
      fileObjectId: 'file-applied',
      resume: { id: 'resume-1', name: 'Backend CV' },
    },
  }));

  const findActiveSystemByCode = jest.fn<(code: SystemRecruitmentStageCode, db?: unknown) => Promise<MockStage | null>>();
  const findActiveSystemById = jest.fn<(id: string, db?: unknown) => Promise<MockStage | null>>();
  const findActiveForCompanyById = jest.fn<(id: string, companyId: string, db?: unknown) => Promise<MockStage | null>>();
  findActiveSystemByCode.mockImplementation(async (code) => stage(code));
  findActiveSystemById.mockImplementation(async () => stage('SCREENING'));
  findActiveForCompanyById.mockImplementation(async () => stage('SCREENING'));

  const createHistory = jest.fn<(input: unknown, db?: unknown) => Promise<{ id: string }>>();
  const findCandidateHistory = jest.fn<(applicationId: string, db?: unknown) => Promise<unknown[]>>();
  const findRecruiterHistory = jest.fn<(applicationId: string, db?: unknown) => Promise<unknown[]>>();
  createHistory.mockImplementation(async () => ({ id: 'history-1' }));
  findCandidateHistory.mockImplementation(async () => []);
  findRecruiterHistory.mockImplementation(async () => []);

  const openFile = jest.fn<(fileObjectId: string) => Promise<{
    fileObject: { id: string; originalFilename: string };
    stream: Readable;
    contentType: string;
    sizeBytes: bigint;
    sha256: string;
  }>>();
  openFile.mockImplementation(async () => ({
    fileObject: { id: 'file-applied', originalFilename: 'cv-v1.pdf' },
    stream: Readable.from([Buffer.from('%PDF-test')]),
    contentType: 'application/pdf',
    sizeBytes: 9n,
    sha256: 'sha256',
  }));

  const prisma = { $transaction: transaction } as unknown as PrismaService;
  const fileStorageService = { open: openFile } as unknown as FileStorageService;
  const applicationCandidatesRepository = { findProfileByUserId, lockOwnedResumeVersion } as unknown as ApplicationCandidatesRepository;
  const applicationCompanyMembershipsRepository = { findByCompanyAndUser: findMembership } as unknown as ApplicationCompanyMembershipsRepository;
  const applicationJobsRepository = { lockPublishedById, findCompanyJobById } as unknown as ApplicationJobsRepository;
  const applicationsRepository = {
    findByJobAndCandidate,
    create: createApplication,
    findByCandidateProfileId,
    findCandidateOwnedByIdWithDetail,
    lockCandidateOwnedById,
    findCandidateOwnedByIdWithStage,
    withdraw: withdrawApplication,
    findRecruiterApplications,
    countRecruiterApplications,
    findRecruiterOwnedByIdWithDetail,
    lockRecruiterOwnedById,
    findRecruiterOwnedByIdWithStage,
    updateCurrentStage,
    findRecruiterResumeTarget,
  } as unknown as ApplicationsRepository;
  const recruitmentStagesRepository = { findActiveSystemByCode, findActiveSystemById, findActiveForCompanyById } as unknown as RecruitmentStagesRepository;
  const applicationStageHistoryRepository = {
    create: createHistory,
    findCandidateVisibleByApplicationId: findCandidateHistory,
    findByApplicationId: findRecruiterHistory,
  } as unknown as ApplicationStageHistoryRepository;

  const service = new ApplicationsService(
    prisma,
    fileStorageService,
    applicationCompanyMembershipsRepository,
    applicationsRepository,
    recruitmentStagesRepository,
    applicationStageHistoryRepository,
    applicationCandidatesRepository,
    applicationJobsRepository,
  );

  return {
    tx,
    service,
    mocks: {
      transaction,
      findProfileByUserId,
      lockOwnedResumeVersion,
      findMembership,
      lockPublishedById,
      findCompanyJobById,
      findByJobAndCandidate,
      createApplication,
      findByCandidateProfileId,
      findCandidateOwnedByIdWithDetail,
      lockCandidateOwnedById,
      findCandidateOwnedByIdWithStage,
      withdrawApplication,
      findRecruiterApplications,
      countRecruiterApplications,
      findRecruiterOwnedByIdWithDetail,
      lockRecruiterOwnedById,
      findRecruiterOwnedByIdWithStage,
      updateCurrentStage,
      findRecruiterResumeTarget,
      findActiveSystemByCode,
      findActiveSystemById,
      findActiveForCompanyById,
      createHistory,
      findCandidateHistory,
      findRecruiterHistory,
      openFile,
    },
  };
}

describe('ApplicationsService - candidate apply', () => {
  it('snapshots exact published JobVersion and selected ResumeVersion', async () => {
    const { tx, service, mocks } = createMocks();
    const result = await service.apply('job-1', 'candidate-user-1', {
      resumeVersionId: 'resume-version-1',
      coverLetter: 'Hello',
    });

    expect(mocks.lockPublishedById).toHaveBeenCalledWith('job-1', tx);
    expect(mocks.lockOwnedResumeVersion).toHaveBeenCalledWith('candidate-1', 'resume-version-1', tx);
    expect(mocks.createApplication).toHaveBeenCalledWith({
      jobId: 'job-1',
      jobVersionId: 'job-version-1',
      candidateProfileId: 'candidate-1',
      resumeVersionId: 'resume-version-1',
      currentStageId: 'stage-applied',
      source: 'DIRECT',
      coverLetter: 'Hello',
    }, tx);
    expect(mocks.createHistory).toHaveBeenCalledWith({
      applicationId: 'application-1',
      fromStageId: null,
      toStageId: 'stage-applied',
      changedByUserId: 'candidate-user-1',
      note: null,
    }, tx);
    expect(result.application.jobVersionId).toBe('job-version-1');
  });

  it('rejects apply when CandidateProfile does not exist', async () => {
    const { service, mocks } = createMocks();
    mocks.findProfileByUserId.mockImplementation(async () => null);

    await expect(service.apply('job-1', 'user-1', { resumeVersionId: 'resume-version-1' })).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.lockPublishedById).not.toHaveBeenCalled();
  });

  it('rejects apply when Job is unavailable', async () => {
    const { service, mocks } = createMocks();
    mocks.lockPublishedById.mockImplementation(async () => null);

    await expect(service.apply('job-1', 'user-1', { resumeVersionId: 'resume-version-1' })).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.lockOwnedResumeVersion).not.toHaveBeenCalled();
  });

  it('rejects ResumeVersion not owned by Candidate', async () => {
    const { service, mocks } = createMocks();
    mocks.lockOwnedResumeVersion.mockImplementation(async () => false);

    await expect(service.apply('job-1', 'user-1', { resumeVersionId: 'resume-version-x' })).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.createApplication).not.toHaveBeenCalled();
  });

  it('rejects duplicate application before create', async () => {
    const { service, mocks } = createMocks();
    mocks.findByJobAndCandidate.mockImplementation(async () => application());

    await expect(service.apply('job-1', 'user-1', { resumeVersionId: 'resume-version-1' })).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.createApplication).not.toHaveBeenCalled();
  });

  it('maps concurrent P2002 duplicate protection to ConflictException', async () => {
    const { service, mocks } = createMocks();
    mocks.createApplication.mockImplementation(async () => {
      throw { code: 'P2002' };
    });

    await expect(service.apply('job-1', 'user-1', { resumeVersionId: 'resume-version-1' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('fails when system APPLIED stage is not configured', async () => {
    const { service, mocks } = createMocks();
    mocks.findActiveSystemByCode.mockImplementation(async () => null);

    await expect(service.apply('job-1', 'user-1', { resumeVersionId: 'resume-version-1' })).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

describe('ApplicationsService - candidate applications', () => {
  it('lists only applications of current CandidateProfile', async () => {
    const { service, mocks } = createMocks();
    const result = await service.listMine('candidate-user-1');

    expect(mocks.findByCandidateProfileId).toHaveBeenCalledWith('candidate-1');
    expect(result).toHaveLength(1);
  });

  it('returns 404 when candidate accesses application outside ownership scope', async () => {
    const { service, mocks } = createMocks();
    mocks.findCandidateOwnedByIdWithDetail.mockImplementation(async () => null);

    await expect(service.getMine('application-other', 'candidate-user-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.findCandidateHistory).not.toHaveBeenCalled();
  });

  it('returns candidate-visible history for owned application', async () => {
    const { service, mocks } = createMocks();
    mocks.findCandidateHistory.mockImplementation(async () => [{ id: 'history-1' }]);

    const result = await service.getMine('application-1', 'candidate-user-1');

    expect(mocks.findCandidateHistory).toHaveBeenCalledWith('application-1');
    expect(result.history).toEqual([{ id: 'history-1' }]);
  });
});

describe('ApplicationsService - withdraw', () => {
  it('withdraws atomically and appends history', async () => {
    const { tx, service, mocks } = createMocks();
    const result = await service.withdraw('application-1', 'candidate-user-1');

    expect(mocks.lockCandidateOwnedById).toHaveBeenCalledWith('application-1', 'candidate-1', tx);
    expect(mocks.withdrawApplication).toHaveBeenCalledWith('application-1', 'stage-withdrawn', expect.any(Date), tx);
    expect(mocks.createHistory).toHaveBeenCalledWith({
      applicationId: 'application-1',
      fromStageId: 'stage-applied',
      toStageId: 'stage-withdrawn',
      changedByUserId: 'candidate-user-1',
      note: null,
    }, tx);
    expect(result.currentStage.code).toBe('WITHDRAWN');
    expect(result.application.withdrawnAt).toBeInstanceOf(Date);
  });

  it('returns 404 when candidate does not own application', async () => {
    const { service, mocks } = createMocks();
    mocks.lockCandidateOwnedById.mockImplementation(async () => false);

    await expect(service.withdraw('application-other', 'candidate-user-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.withdrawApplication).not.toHaveBeenCalled();
  });

  it('rejects withdrawing twice', async () => {
    const { service, mocks } = createMocks();
    mocks.findCandidateOwnedByIdWithStage.mockImplementation(async () => ({
      ...applicationWithStage('WITHDRAWN'),
      withdrawnAt: NOW,
    }));

    await expect(service.withdraw('application-1', 'candidate-user-1')).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.withdrawApplication).not.toHaveBeenCalled();
  });

  it('rejects withdrawal from terminal recruiter outcome', async () => {
    const { service, mocks } = createMocks();
    mocks.findCandidateOwnedByIdWithStage.mockImplementation(async () => applicationWithStage('REJECTED'));

    await expect(service.withdraw('application-1', 'candidate-user-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(mocks.withdrawApplication).not.toHaveBeenCalled();
  });

  it('fails if WITHDRAWN system stage is missing', async () => {
    const { service, mocks } = createMocks();
    mocks.findActiveSystemByCode.mockImplementation(async (code) => code === 'WITHDRAWN' ? null : stage(code));

    await expect(service.withdraw('application-1', 'candidate-user-1')).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

describe('ApplicationsService - recruiter read', () => {
  it('rejects recruiter without ACTIVE company membership', async () => {
    const { service, mocks } = createMocks();
    mocks.findMembership.mockImplementation(async () => null);

    await expect(service.listForRecruiter('company-1', 'job-1', 'recruiter-1', { page: 1, limit: 20 })).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.findCompanyJobById).not.toHaveBeenCalled();
  });

  it('returns 404 when requested Job does not belong to company', async () => {
    const { service, mocks } = createMocks();
    mocks.findCompanyJobById.mockImplementation(async () => null);

    await expect(service.listForRecruiter('company-1', 'job-company-2', 'recruiter-1', { page: 1, limit: 20 })).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.findRecruiterApplications).not.toHaveBeenCalled();
  });

  it('rejects invalid stage filter', async () => {
    const { service, mocks } = createMocks();
    mocks.findActiveForCompanyById.mockImplementation(async () => null);

    await expect(service.listForRecruiter('company-1', 'job-1', 'recruiter-1', {
      stageId: '0198f4e1-7c2a-7bcd-8123-123456789abc',
      page: 1,
      limit: 20,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns paginated recruiter application list', async () => {
    const { service, mocks } = createMocks();
    mocks.findRecruiterApplications.mockImplementation(async () => [application()]);
    mocks.countRecruiterApplications.mockImplementation(async () => 41);

    const result = await service.listForRecruiter('company-1', 'job-1', 'recruiter-1', {
      stageId: '0198f4e1-7c2a-7bcd-8123-123456789abc',
      page: 2,
      limit: 20,
    });

    expect(mocks.findRecruiterApplications).toHaveBeenCalledWith('job-1', 'company-1', {
      stageId: '0198f4e1-7c2a-7bcd-8123-123456789abc',
      skip: 20,
      take: 20,
    });
    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
  });

  it('returns recruiter detail with internal history', async () => {
    const { service, mocks } = createMocks();
    mocks.findRecruiterHistory.mockImplementation(async () => [{ id: 'history-1', note: 'Passed screening' }]);

    const result = await service.getForRecruiter('company-1', 'application-1', 'recruiter-1');

    expect(mocks.findRecruiterOwnedByIdWithDetail).toHaveBeenCalledWith('application-1', 'company-1');
    expect(mocks.findRecruiterHistory).toHaveBeenCalledWith('application-1');
    expect(result.history).toHaveLength(1);
  });

  it('does not reveal application from another company', async () => {
    const { service, mocks } = createMocks();
    mocks.findRecruiterOwnedByIdWithDetail.mockImplementation(async () => null);

    await expect(service.getForRecruiter('company-1', 'application-company-2', 'recruiter-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ApplicationsService - recruiter stage workflow', () => {
  it('allows APPLIED -> SCREENING and appends audit history', async () => {
    const { tx, service, mocks } = createMocks();
    mocks.findActiveSystemById.mockImplementation(async () => stage('SCREENING'));

    const result = await service.changeStage('company-1', 'application-1', 'recruiter-1', {
      stageId: 'stage-screening',
      note: 'Passed initial review',
    });

    expect(mocks.lockRecruiterOwnedById).toHaveBeenCalledWith('application-1', 'company-1', tx);
    expect(mocks.updateCurrentStage).toHaveBeenCalledWith('application-1', 'stage-screening', tx);
    expect(mocks.createHistory).toHaveBeenCalledWith({
      applicationId: 'application-1',
      fromStageId: 'stage-applied',
      toStageId: 'stage-screening',
      changedByUserId: 'recruiter-1',
      note: 'Passed initial review',
    }, tx);
    expect(result.currentStage.code).toBe('SCREENING');
  });

  it('blocks REVIEWER from changing stage', async () => {
    const { service, mocks } = createMocks();
    mocks.findMembership.mockImplementation(async () => ({ role: 'REVIEWER', status: 'ACTIVE' }));

    await expect(service.changeStage('company-1', 'application-1', 'reviewer-1', {
      stageId: 'stage-screening',
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.lockRecruiterOwnedById).not.toHaveBeenCalled();
  });

  it('returns 404 for cross-company application mutation', async () => {
    const { service, mocks } = createMocks();
    mocks.lockRecruiterOwnedById.mockImplementation(async () => false);

    await expect(service.changeStage('company-1', 'application-company-2', 'recruiter-1', {
      stageId: 'stage-screening',
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects same-stage transition', async () => {
    const { service, mocks } = createMocks();
    mocks.findActiveSystemById.mockImplementation(async () => stage('APPLIED'));

    await expect(service.changeStage('company-1', 'application-1', 'recruiter-1', {
      stageId: 'stage-applied',
    })).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.updateCurrentStage).not.toHaveBeenCalled();
  });

  it('rejects recruiter setting WITHDRAWN', async () => {
    const { service, mocks } = createMocks();
    mocks.findActiveSystemById.mockImplementation(async () => stage('WITHDRAWN'));

    await expect(service.changeStage('company-1', 'application-1', 'recruiter-1', {
      stageId: 'stage-withdrawn',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(mocks.updateCurrentStage).not.toHaveBeenCalled();
  });

  it('rejects stage skipping APPLIED -> INTERVIEW', async () => {
    const { service, mocks } = createMocks();
    mocks.findActiveSystemById.mockImplementation(async () => stage('INTERVIEW'));

    await expect(service.changeStage('company-1', 'application-1', 'recruiter-1', {
      stageId: 'stage-interview',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(mocks.updateCurrentStage).not.toHaveBeenCalled();
  });

  it('rejects transition from terminal stage', async () => {
    const { service, mocks } = createMocks();
    mocks.findRecruiterOwnedByIdWithStage.mockImplementation(async () => applicationWithStage('REJECTED'));

    await expect(service.changeStage('company-1', 'application-1', 'recruiter-1', {
      stageId: 'stage-screening',
    })).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.findActiveSystemById).not.toHaveBeenCalled();
  });

  it('rejects inactive or invalid target stage', async () => {
    const { service, mocks } = createMocks();
    mocks.findActiveSystemById.mockImplementation(async () => null);

    await expect(service.changeStage('company-1', 'application-1', 'recruiter-1', {
      stageId: 'stage-invalid',
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ApplicationsService - application-scoped resume access', () => {
  it('opens exact ResumeVersion referenced by Application', async () => {
    const { service, mocks } = createMocks();

    const result = await service.openRecruiterResume('company-1', 'application-1', 'reviewer-1');

    expect(mocks.findRecruiterResumeTarget).toHaveBeenCalledWith('application-1', 'company-1');
    expect(mocks.openFile).toHaveBeenCalledWith('file-applied');
    expect(result.resumeVersion.id).toBe('resume-version-1');
    expect(result.fileObject.id).toBe('file-applied');
  });

  it('allows ACTIVE REVIEWER to read application resume', async () => {
    const { service, mocks } = createMocks();
    mocks.findMembership.mockImplementation(async () => ({ role: 'REVIEWER', status: 'ACTIVE' }));

    await expect(service.openRecruiterResume('company-1', 'application-1', 'reviewer-1')).resolves.toBeDefined();
    expect(mocks.openFile).toHaveBeenCalledWith('file-applied');
  });

  it('does not resolve resume from another company application', async () => {
    const { service, mocks } = createMocks();
    mocks.findRecruiterResumeTarget.mockImplementation(async () => null);

    await expect(service.openRecruiterResume('company-1', 'application-company-2', 'recruiter-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.openFile).not.toHaveBeenCalled();
  });

  it('propagates unavailable FileObject as NotFoundException', async () => {
    const { service, mocks } = createMocks();
    mocks.openFile.mockImplementation(async () => {
      throw new NotFoundException('File object not found');
    });

    await expect(service.openRecruiterResume('company-1', 'application-1', 'recruiter-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects non-active company membership before resolving resume', async () => {
    const { service, mocks } = createMocks();
    mocks.findMembership.mockImplementation(async () => ({ role: 'RECRUITER', status: 'SUSPENDED' }));

    await expect(service.openRecruiterResume('company-1', 'application-1', 'recruiter-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.findRecruiterResumeTarget).not.toHaveBeenCalled();
  });
});