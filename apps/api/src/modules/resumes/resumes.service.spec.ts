import { describe, expect, it, jest } from '@jest/globals';
import { Readable } from 'node:stream';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { ResumeVersionsRepository } from './repositories/resume-versions.repository';
import { ResumesRepository } from './repositories/resumes.repository';
import { ResumesService } from './resumes.service';

interface MockFileObject {
  id: string;
  storageProvider: string;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
  sha256: string;
  uploadedByUserId: string;
  status: string;
  createdAt: Date;
  deletedAt: Date | null;
}

interface MockResume {
  id: string;
  candidateProfileId: string;
  name: string;
  isDefault: boolean;
  currentVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface MockResumeVersion {
  id: string;
  resumeId: string;
  versionNo: number;
  fileObjectId: string;
  createdByUserId: string;
  createdAt: Date;
}

function fileInput() {
  return {
    bucket: 'resumes',
    objectKey: 'users/user-1/resumes/test.pdf',
    originalFilename: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100n,
    content: Readable.from([Buffer.from('%PDF-test')]),
  };
}

function activeFileObject(id = 'file-1'): MockFileObject {
  return {
    id,
    storageProvider: 'DISCLOUD',
    bucket: 'resumes',
    objectKey: `users/user-1/resumes/${id}.pdf`,
    originalFilename: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100n,
    sha256: 'file-sha256',
    uploadedByUserId: 'user-1',
    status: 'ACTIVE',
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    deletedAt: null,
  };
}

function resume(overrides: Partial<MockResume> = {}): MockResume {
  return {
    id: 'resume-1',
    candidateProfileId: 'candidate-1',
    name: 'Backend CV',
    isDefault: true,
    currentVersionId: 'version-1',
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    updatedAt: new Date('2026-08-16T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function resumeVersion(overrides: Partial<MockResumeVersion> = {}): MockResumeVersion {
  return {
    id: 'version-1',
    resumeId: 'resume-1',
    versionNo: 1,
    fileObjectId: 'file-1',
    createdByUserId: 'user-1',
    createdAt: new Date('2026-08-16T00:00:00.000Z'),
    ...overrides,
  };
}

function createMocks() {
  const tx = {};

  const transaction = jest.fn<(callback: (client: unknown) => Promise<unknown>) => Promise<unknown>>();
  transaction.mockImplementation(async (callback) => callback(tx));

  const storeFile = jest.fn<(input: unknown) => Promise<MockFileObject>>();
  const deleteFile = jest.fn<(fileObjectId: string) => Promise<void>>();
  storeFile.mockImplementation(async () => activeFileObject());
  deleteFile.mockImplementation(async () => undefined);

  const lockCandidateProfile = jest.fn<(candidateProfileId: string, db: unknown) => Promise<boolean>>();
  const lockActiveOwnedById = jest.fn<(id: string, candidateProfileId: string, db: unknown) => Promise<boolean>>();
  const countActiveByCandidateProfileId = jest.fn<(candidateProfileId: string, db?: unknown) => Promise<number>>();
  const createResume = jest.fn<(input: unknown, db?: unknown) => Promise<MockResume>>();
  const setCurrentVersion = jest.fn<(id: string, currentVersionId: string, db?: unknown) => Promise<MockResume>>();
  const findActiveOwnedById = jest.fn<(id: string, candidateProfileId: string, db?: unknown) => Promise<MockResume | null>>();
  const findMostRecentActive = jest.fn<(candidateProfileId: string, db?: unknown) => Promise<MockResume | null>>();
  const clearDefaults = jest.fn<(candidateProfileId: string, db?: unknown) => Promise<{ count: number }>>();
  const setDefault = jest.fn<(id: string, db?: unknown) => Promise<MockResume>>();
  const softDelete = jest.fn<(id: string, db?: unknown) => Promise<MockResume>>();

  const createVersion = jest.fn<(input: unknown, db?: unknown) => Promise<MockResumeVersion>>();
  const getNextVersionNo = jest.fn<(resumeId: string, db?: unknown) => Promise<number>>();

  const prisma = { $transaction: transaction } as unknown as PrismaService;
  const fileStorageService = { store: storeFile, delete: deleteFile } as unknown as FileStorageService;

  const resumesRepository = {
    lockCandidateProfile,
    lockActiveOwnedById,
    countActiveByCandidateProfileId,
    create: createResume,
    setCurrentVersion,
    findActiveOwnedById,
    findMostRecentActive,
    clearDefaults,
    setDefault,
    softDelete,
  } as unknown as ResumesRepository;

  const resumeVersionsRepository = {
    create: createVersion,
    getNextVersionNo,
  } as unknown as ResumeVersionsRepository;

  const service = new ResumesService(prisma, fileStorageService, resumesRepository, resumeVersionsRepository);

  return {
    tx,
    service,
    mocks: {
      transaction,
      storeFile,
      deleteFile,
      lockCandidateProfile,
      lockActiveOwnedById,
      countActiveByCandidateProfileId,
      createResume,
      setCurrentVersion,
      findActiveOwnedById,
      findMostRecentActive,
      clearDefaults,
      setDefault,
      softDelete,
      createVersion,
      getNextVersionNo,
    },
  };
}

describe('ResumesService', () => {
  it('makes the first active resume default', async () => {
    const { tx, service, mocks } = createMocks();

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.countActiveByCandidateProfileId.mockImplementation(async () => 0);
    mocks.createResume.mockImplementation(async () => resume({ currentVersionId: null }));
    mocks.createVersion.mockImplementation(async () => resumeVersion());
    mocks.setCurrentVersion.mockImplementation(async () => resume());

    const result = await service.create({
      candidateProfileId: 'candidate-1',
      createdByUserId: 'user-1',
      name: 'Backend CV',
      file: fileInput(),
    });

    expect(mocks.createResume).toHaveBeenCalledWith({
      candidateProfileId: 'candidate-1',
      name: 'Backend CV',
      isDefault: true,
    }, tx);
    expect(mocks.createVersion).toHaveBeenCalledWith({
      resumeId: 'resume-1',
      versionNo: 1,
      fileObjectId: 'file-1',
      createdByUserId: 'user-1',
    }, tx);
    expect(mocks.setCurrentVersion).toHaveBeenCalledWith('resume-1', 'version-1', tx);
    expect(result.resume.currentVersionId).toBe('version-1');
    expect(result.resume.isDefault).toBe(true);
    expect(result.version.versionNo).toBe(1);
    expect(result.fileObject.id).toBe('file-1');
  });

  it('does not make a later resume default', async () => {
    const { service, mocks } = createMocks();

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.countActiveByCandidateProfileId.mockImplementation(async () => 2);
    mocks.createResume.mockImplementation(async () => resume({
      id: 'resume-2',
      name: 'Frontend CV',
      isDefault: false,
      currentVersionId: null,
    }));
    mocks.createVersion.mockImplementation(async () => resumeVersion({
      id: 'version-2',
      resumeId: 'resume-2',
    }));
    mocks.setCurrentVersion.mockImplementation(async () => resume({
      id: 'resume-2',
      name: 'Frontend CV',
      isDefault: false,
      currentVersionId: 'version-2',
    }));

    const result = await service.create({
      candidateProfileId: 'candidate-1',
      createdByUserId: 'user-1',
      name: 'Frontend CV',
      file: fileInput(),
    });

    expect(mocks.createResume).toHaveBeenCalledWith(expect.objectContaining({
      candidateProfileId: 'candidate-1',
      name: 'Frontend CV',
      isDefault: false,
    }), expect.anything());
    expect(result.resume.isDefault).toBe(false);
  });

  it('creates the next version and updates currentVersionId', async () => {
    const { tx, service, mocks } = createMocks();

    mocks.lockActiveOwnedById.mockImplementation(async () => true);
    mocks.getNextVersionNo.mockImplementation(async () => 3);
    mocks.createVersion.mockImplementation(async () => resumeVersion({
      id: 'version-3',
      versionNo: 3,
    }));
    mocks.setCurrentVersion.mockImplementation(async () => resume({
      currentVersionId: 'version-3',
    }));

    const result = await service.addVersion({
      resumeId: 'resume-1',
      candidateProfileId: 'candidate-1',
      createdByUserId: 'user-1',
      file: fileInput(),
    });

    expect(mocks.lockActiveOwnedById).toHaveBeenCalledWith('resume-1', 'candidate-1', tx);
    expect(mocks.getNextVersionNo).toHaveBeenCalledWith('resume-1', tx);
    expect(mocks.createVersion).toHaveBeenCalledWith({
      resumeId: 'resume-1',
      versionNo: 3,
      fileObjectId: 'file-1',
      createdByUserId: 'user-1',
    }, tx);
    expect(mocks.setCurrentVersion).toHaveBeenCalledWith('resume-1', 'version-3', tx);
    expect(result.version.versionNo).toBe(3);
    expect(result.resume.currentVersionId).toBe('version-3');
  });

  it('cleans up the uploaded file when addVersion ownership check fails', async () => {
    const { service, mocks } = createMocks();

    mocks.lockActiveOwnedById.mockImplementation(async () => false);

    await expect(service.addVersion({
      resumeId: 'resume-other',
      candidateProfileId: 'candidate-1',
      createdByUserId: 'user-1',
      file: fileInput(),
    })).rejects.toBeInstanceOf(NotFoundException);

    expect(mocks.deleteFile).toHaveBeenCalledTimes(1);
    expect(mocks.deleteFile).toHaveBeenCalledWith('file-1');
    expect(mocks.getNextVersionNo).not.toHaveBeenCalled();
    expect(mocks.createVersion).not.toHaveBeenCalled();
  });

  it('cleans up the uploaded file when create transaction fails', async () => {
    const { service, mocks } = createMocks();

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.countActiveByCandidateProfileId.mockImplementation(async () => 0);
    mocks.createResume.mockImplementation(async () => {
      throw new Error('database failed');
    });

    await expect(service.create({
      candidateProfileId: 'candidate-1',
      createdByUserId: 'user-1',
      name: 'Backend CV',
      file: fileInput(),
    })).rejects.toThrow('database failed');

    expect(mocks.deleteFile).toHaveBeenCalledTimes(1);
    expect(mocks.deleteFile).toHaveBeenCalledWith('file-1');
  });

  it('preserves the original transaction error when cleanup also fails', async () => {
    const { service, mocks } = createMocks();

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.countActiveByCandidateProfileId.mockImplementation(async () => 0);
    mocks.createResume.mockImplementation(async () => {
      throw new Error('database failed');
    });
    mocks.deleteFile.mockImplementation(async () => {
      throw new Error('cleanup failed');
    });

    await expect(service.create({
      candidateProfileId: 'candidate-1',
      createdByUserId: 'user-1',
      name: 'Backend CV',
      file: fileInput(),
    })).rejects.toThrow('database failed');

    expect(mocks.deleteFile).toHaveBeenCalledWith('file-1');
  });

  it('clears previous defaults before setting another resume as default', async () => {
    const { tx, service, mocks } = createMocks();
    const target = resume({
      id: 'resume-2',
      name: 'Frontend CV',
      isDefault: false,
      currentVersionId: 'version-2',
    });

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.findActiveOwnedById.mockImplementation(async () => target);
    mocks.clearDefaults.mockImplementation(async () => ({ count: 1 }));
    mocks.setDefault.mockImplementation(async () => ({ ...target, isDefault: true }));

    const result = await service.setDefault('resume-2', 'candidate-1');

    expect(mocks.lockCandidateProfile).toHaveBeenCalledWith('candidate-1', tx);
    expect(mocks.findActiveOwnedById).toHaveBeenCalledWith('resume-2', 'candidate-1', tx);
    expect(mocks.clearDefaults).toHaveBeenCalledWith('candidate-1', tx);
    expect(mocks.setDefault).toHaveBeenCalledWith('resume-2', tx);
    expect(result.isDefault).toBe(true);

    const clearOrder = mocks.clearDefaults.mock.invocationCallOrder[0];
    const setOrder = mocks.setDefault.mock.invocationCallOrder[0];

    expect(clearOrder).toBeDefined();
    expect(setOrder).toBeDefined();
    expect(clearOrder!).toBeLessThan(setOrder!);
  });

  it('throws when setting default for a resume not owned by the candidate', async () => {
    const { service, mocks } = createMocks();

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.findActiveOwnedById.mockImplementation(async () => null);

    await expect(service.setDefault('resume-other', 'candidate-1')).rejects.toBeInstanceOf(NotFoundException);

    expect(mocks.clearDefaults).not.toHaveBeenCalled();
    expect(mocks.setDefault).not.toHaveBeenCalled();
  });

  it('promotes another resume when deleting the current default', async () => {
    const { tx, service, mocks } = createMocks();

    const current = resume();
    const replacement = resume({
      id: 'resume-2',
      name: 'Frontend CV',
      isDefault: false,
      currentVersionId: 'version-2',
    });
    const deletedAt = new Date('2026-08-16T01:00:00.000Z');

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.findActiveOwnedById.mockImplementation(async () => current);
    mocks.softDelete.mockImplementation(async () => ({
      ...current,
      isDefault: false,
      deletedAt,
    }));
    mocks.findMostRecentActive.mockImplementation(async () => replacement);
    mocks.setDefault.mockImplementation(async () => ({
      ...replacement,
      isDefault: true,
    }));

    const result = await service.delete('resume-1', 'candidate-1');

    expect(mocks.lockCandidateProfile).toHaveBeenCalledWith('candidate-1', tx);
    expect(mocks.findActiveOwnedById).toHaveBeenCalledWith('resume-1', 'candidate-1', tx);
    expect(mocks.softDelete).toHaveBeenCalledWith('resume-1', tx);
    expect(mocks.findMostRecentActive).toHaveBeenCalledWith('candidate-1', tx);
    expect(mocks.setDefault).toHaveBeenCalledWith('resume-2', tx);
    expect(result.deletedAt).toEqual(deletedAt);
    expect(result.isDefault).toBe(false);
  });

  it('does not promote another resume when deleting a non-default resume', async () => {
    const { service, mocks } = createMocks();

    const target = resume({
      id: 'resume-2',
      name: 'Frontend CV',
      isDefault: false,
      currentVersionId: 'version-2',
    });

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.findActiveOwnedById.mockImplementation(async () => target);
    mocks.softDelete.mockImplementation(async () => ({
      ...target,
      deletedAt: new Date('2026-08-16T01:00:00.000Z'),
    }));

    await service.delete('resume-2', 'candidate-1');

    expect(mocks.softDelete).toHaveBeenCalled();
    expect(mocks.findMostRecentActive).not.toHaveBeenCalled();
    expect(mocks.setDefault).not.toHaveBeenCalled();
  });

  it('does not promote a replacement when deleting the last default resume', async () => {
    const { service, mocks } = createMocks();

    const current = resume();

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.findActiveOwnedById.mockImplementation(async () => current);
    mocks.softDelete.mockImplementation(async () => ({
      ...current,
      isDefault: false,
      deletedAt: new Date('2026-08-16T01:00:00.000Z'),
    }));
    mocks.findMostRecentActive.mockImplementation(async () => null);

    await service.delete('resume-1', 'candidate-1');

    expect(mocks.findMostRecentActive).toHaveBeenCalled();
    expect(mocks.setDefault).not.toHaveBeenCalled();
  });

  it('throws when deleting a resume not owned by the candidate', async () => {
    const { service, mocks } = createMocks();

    mocks.lockCandidateProfile.mockImplementation(async () => true);
    mocks.findActiveOwnedById.mockImplementation(async () => null);

    await expect(service.delete('resume-other', 'candidate-1')).rejects.toBeInstanceOf(NotFoundException);

    expect(mocks.softDelete).not.toHaveBeenCalled();
  });
});