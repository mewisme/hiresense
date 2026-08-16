import type { Readable } from 'node:stream';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { ResumeVersionsRepository } from './repositories/resume-versions.repository';
import { ResumesRepository } from './repositories/resumes.repository';

export interface ResumeFileInput {
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
  content: Readable;
}

export interface CreateResumeInput {
  candidateProfileId: string;
  createdByUserId: string;
  name: string;
  file: ResumeFileInput;
}

export interface AddResumeVersionInput {
  resumeId: string;
  candidateProfileId: string;
  createdByUserId: string;
  file: ResumeFileInput;
}

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: FileStorageService,
    private readonly resumesRepository: ResumesRepository,
    private readonly resumeVersionsRepository: ResumeVersionsRepository,
  ) { }

  async create(input: CreateResumeInput) {
    const fileObject = await this.storeFile(input.file, input.createdByUserId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const candidateExists = await this.resumesRepository.lockCandidateProfile(input.candidateProfileId, tx);
        if (!candidateExists) throw new NotFoundException('Candidate profile not found');

        const activeCount = await this.resumesRepository.countActiveByCandidateProfileId(input.candidateProfileId, tx);
        const resume = await this.resumesRepository.create({
          candidateProfileId: input.candidateProfileId,
          name: input.name,
          isDefault: activeCount === 0,
        }, tx);

        const version = await this.resumeVersionsRepository.create({
          resumeId: resume.id,
          versionNo: 1,
          fileObjectId: fileObject.id,
          createdByUserId: input.createdByUserId,
        }, tx);

        const updatedResume = await this.resumesRepository.setCurrentVersion(resume.id, version.id, tx);
        return { resume: updatedResume, version, fileObject };
      });
    } catch (error) {
      await this.cleanupFile(fileObject.id);
      throw error;
    }
  }

  async addVersion(input: AddResumeVersionInput) {
    const fileObject = await this.storeFile(input.file, input.createdByUserId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const locked = await this.resumesRepository.lockActiveOwnedById(input.resumeId, input.candidateProfileId, tx);
        if (!locked) throw new NotFoundException('Resume not found');

        const versionNo = await this.resumeVersionsRepository.getNextVersionNo(input.resumeId, tx);
        const version = await this.resumeVersionsRepository.create({
          resumeId: input.resumeId,
          versionNo,
          fileObjectId: fileObject.id,
          createdByUserId: input.createdByUserId,
        }, tx);

        const resume = await this.resumesRepository.setCurrentVersion(input.resumeId, version.id, tx);
        return { resume, version, fileObject };
      });
    } catch (error) {
      await this.cleanupFile(fileObject.id);
      throw error;
    }
  }

  async list(candidateProfileId: string) {
    const resumes = await this.resumesRepository.findByCandidateProfileId(candidateProfileId);
    const currentVersionIds = resumes.flatMap((resume) => resume.currentVersionId ? [resume.currentVersionId] : []);
    const versions = await this.resumeVersionsRepository.findByIds(currentVersionIds);
    const versionsById = new Map(versions.map((version) => [version.id, version] as const));

    return resumes.map((resume) => ({
      resume,
      currentVersion: resume.currentVersionId ? versionsById.get(resume.currentVersionId) ?? null : null,
    }));
  }

  async getDetail(resumeId: string, candidateProfileId: string) {
    const resume = await this.requireOwnedResume(resumeId, candidateProfileId);
    const versions = await this.resumeVersionsRepository.findByResumeId(resume.id);
    return { resume, versions };
  }

  async openCurrentVersion(resumeId: string, candidateProfileId: string) {
    const resume = await this.requireOwnedResume(resumeId, candidateProfileId);
    if (!resume.currentVersionId) throw new NotFoundException('Resume has no current version');

    const version = await this.resumeVersionsRepository.findOwnedById(resume.currentVersionId, resume.id);
    if (!version) throw new NotFoundException('Resume version not found');

    const stored = await this.fileStorageService.open(version.fileObjectId);
    return { resume, version, ...stored };
  }

  async openVersion(resumeId: string, versionId: string, candidateProfileId: string) {
    const resume = await this.requireOwnedResume(resumeId, candidateProfileId);
    const version = await this.resumeVersionsRepository.findOwnedById(versionId, resume.id);
    if (!version) throw new NotFoundException('Resume version not found');

    const stored = await this.fileStorageService.open(version.fileObjectId);
    return { resume, version, ...stored };
  }

  async setDefault(resumeId: string, candidateProfileId: string) {
    return this.prisma.$transaction(async (tx) => {
      const candidateExists = await this.resumesRepository.lockCandidateProfile(candidateProfileId, tx);
      if (!candidateExists) throw new NotFoundException('Candidate profile not found');

      const resume = await this.resumesRepository.findActiveOwnedById(resumeId, candidateProfileId, tx);
      if (!resume) throw new NotFoundException('Resume not found');

      await this.resumesRepository.clearDefaults(candidateProfileId, tx);
      return this.resumesRepository.setDefault(resume.id, tx);
    });
  }

  async delete(resumeId: string, candidateProfileId: string) {
    return this.prisma.$transaction(async (tx) => {
      const candidateExists = await this.resumesRepository.lockCandidateProfile(candidateProfileId, tx);
      if (!candidateExists) throw new NotFoundException('Candidate profile not found');

      const resume = await this.resumesRepository.findActiveOwnedById(resumeId, candidateProfileId, tx);
      if (!resume) throw new NotFoundException('Resume not found');

      const deleted = await this.resumesRepository.softDelete(resume.id, tx);

      if (resume.isDefault) {
        const replacement = await this.resumesRepository.findMostRecentActive(candidateProfileId, tx);
        if (replacement) await this.resumesRepository.setDefault(replacement.id, tx);
      }

      return deleted;
    });
  }

  private async requireOwnedResume(resumeId: string, candidateProfileId: string) {
    const resume = await this.resumesRepository.findActiveOwnedById(resumeId, candidateProfileId);
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }

  private storeFile(file: ResumeFileInput, uploadedByUserId: string) {
    return this.fileStorageService.store({ ...file, uploadedByUserId });
  }

  private async cleanupFile(fileObjectId: string): Promise<void> {
    try {
      await this.fileStorageService.delete(fileObjectId);
    } catch {
      // Preserve original Resume transaction error.
    }
  }
}