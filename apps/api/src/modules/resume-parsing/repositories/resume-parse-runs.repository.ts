import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateResumeParseRunInput {
  resumeVersionId: string;
  pipelineVersionId: string;
}

export interface CompleteResumeParseRunInput {
  rawText: string;
  rawOutput?: Prisma.InputJsonValue;
  detectedLanguage?: string | null;
  warnings?: Prisma.InputJsonValue;
  completedAt?: Date;
}

export interface FailResumeParseRunInput {
  errorCode: string;
  errorMessage: string;
  completedAt?: Date;
}

@Injectable()
export class ResumeParseRunsRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(input: CreateResumeParseRunInput, db: DbClient = this.prisma) {
    return db.resumeParseRun.create({
      data: {
        resumeVersionId: input.resumeVersionId,
        pipelineVersionId: input.pipelineVersionId,
        status: 'PENDING',
      },
    });
  }

  findById(id: string, db: DbClient = this.prisma) {
    return db.resumeParseRun.findUnique({ where: { id } });
  }

  findByIdWithResult(id: string, db: DbClient = this.prisma) {
    return db.resumeParseRun.findUnique({
      where: { id },
      include: {
        pipelineVersion: true,
        skills: { include: { skill: true }, orderBy: { createdAt: 'asc' } },
        experiences: { orderBy: { ordinal: 'asc' } },
        educations: { orderBy: { ordinal: 'asc' } },
      },
    });
  }

  findLatestByResumeVersionId(resumeVersionId: string, db: DbClient = this.prisma) {
    return db.resumeParseRun.findFirst({
      where: { resumeVersionId },
      include: { pipelineVersion: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestByResumeVersionAndPipeline(resumeVersionId: string, pipelineVersionId: string, db: DbClient = this.prisma) {
    return db.resumeParseRun.findFirst({
      where: { resumeVersionId, pipelineVersionId },
      include: { pipelineVersion: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestSucceededByResumeVersionId(resumeVersionId: string, db: DbClient = this.prisma) {
    return db.resumeParseRun.findFirst({
      where: { resumeVersionId, status: 'SUCCEEDED' },
      include: {
        pipelineVersion: true,
        skills: { include: { skill: true }, orderBy: { createdAt: 'asc' } },
        experiences: { orderBy: { ordinal: 'asc' } },
        educations: { orderBy: { ordinal: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markProcessing(id: string, startedAt: Date = new Date(), db: DbClient = this.prisma): Promise<boolean> {
    const result = await db.resumeParseRun.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'PROCESSING',
        startedAt,
        completedAt: null,
        errorCode: null,
        errorMessage: null,
      },
    });
    return result.count === 1;
  }

  async markSucceeded(id: string, input: CompleteResumeParseRunInput, db: DbClient = this.prisma): Promise<boolean> {
    const result = await db.resumeParseRun.updateMany({
      where: { id, status: 'PROCESSING' },
      data: {
        status: 'SUCCEEDED',
        rawText: input.rawText,
        detectedLanguage: input.detectedLanguage ?? null,
        completedAt: input.completedAt ?? new Date(),
        errorCode: null,
        errorMessage: null,
        ...(input.rawOutput !== undefined ? { rawOutput: input.rawOutput } : {}),
        ...(input.warnings !== undefined ? { warnings: input.warnings } : {}),
      },
    });
    return result.count === 1;
  }

  async markFailed(id: string, input: FailResumeParseRunInput, db: DbClient = this.prisma): Promise<boolean> {
    const result = await db.resumeParseRun.updateMany({
      where: { id, status: { in: ['PENDING', 'PROCESSING'] } },
      data: {
        status: 'FAILED',
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        completedAt: input.completedAt ?? new Date(),
      },
    });
    return result.count === 1;
  }
}