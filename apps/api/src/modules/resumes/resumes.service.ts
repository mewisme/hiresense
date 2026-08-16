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
        const resume = await this.resumesRepository.create({
          candidateProfileId: input.candidateProfileId,
          name: input.name,
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

  findByCandidateProfileId(candidateProfileId: string) {
    return this.resumesRepository.findByCandidateProfileId(candidateProfileId);
  }

  findOwnedById(resumeId: string, candidateProfileId: string) {
    return this.resumesRepository.findActiveOwnedById(resumeId, candidateProfileId);
  }

  private storeFile(file: ResumeFileInput, uploadedByUserId: string) {
    return this.fileStorageService.store({
      ...file,
      uploadedByUserId,
    });
  }

  private async cleanupFile(fileObjectId: string): Promise<void> {
    try {
      await this.fileStorageService.delete(fileObjectId);
    } catch {
      // Preserve original Resume transaction error.
    }
  }
}