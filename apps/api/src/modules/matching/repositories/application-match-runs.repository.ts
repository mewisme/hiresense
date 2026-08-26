import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface CreateApplicationMatchRunInput {
  applicationId: string;
  resumeParseRunId: string;
  jobVersionId: string;
  pipelineVersionId: string;
}

export interface PersistMatchScoreComponentInput {
  componentCode: string;
  rawScore: number;
  weight: string;
  weightedScore: number;
  details?: Prisma.InputJsonValue;
}

export interface PersistMatchSkillResultInput {
  jobVersionSkillId: string;
  resumeSkillId: string | null;
  status: 'MATCHED' | 'PARTIAL' | 'MISSING';
  similarityScore: number | null;
  evidenceText: string | null;
}

@Injectable()
export class ApplicationMatchRunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPending(input: CreateApplicationMatchRunInput) {
    return this.prisma.applicationMatchRun.create({
      data: {
        applicationId: input.applicationId,
        resumeParseRunId: input.resumeParseRunId,
        jobVersionId: input.jobVersionId,
        pipelineVersionId: input.pipelineVersionId,
        status: 'PENDING',
      },
    });
  }

  async markProcessing(id: string, startedAt: Date = new Date()): Promise<boolean> {
    const result = await this.prisma.applicationMatchRun.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'PROCESSING', startedAt, completedAt: null, errorCode: null, errorMessage: null } });
    return result.count === 1;
  }

  async markFailed(id: string, errorCode: string, errorMessage: string, completedAt: Date = new Date()): Promise<boolean> {
    const result = await this.prisma.applicationMatchRun.updateMany({ where: { id, status: { in: ['PENDING', 'PROCESSING'] } }, data: { status: 'FAILED', completedAt, errorCode, errorMessage } });
    return result.count === 1;
  }

  async persistSucceeded(id: string, applicationId: string, overallScore: number, components: PersistMatchScoreComponentInput[], skillResults: PersistMatchSkillResultInput[], completedAt: Date = new Date()): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (components.length > 0) {
        await tx.matchScoreComponent.createMany({
          data: components.map((component) => ({
            matchRunId: id,
            componentCode: component.componentCode,
            rawScore: new Prisma.Decimal(component.rawScore),
            weight: new Prisma.Decimal(component.weight),
            weightedScore: new Prisma.Decimal(component.weightedScore),
            ...(component.details !== undefined ? { details: component.details } : {}),
          })),
        });
      }

      if (skillResults.length > 0) {
        await tx.matchSkillResult.createMany({
          data: skillResults.map((result) => ({
            matchRunId: id,
            jobVersionSkillId: result.jobVersionSkillId,
            resumeSkillId: result.resumeSkillId,
            status: result.status,
            similarityScore: result.similarityScore == null ? null : new Prisma.Decimal(result.similarityScore),
            evidenceText: result.evidenceText,
          })),
        });
      }

      const completed = await tx.applicationMatchRun.updateMany({
        where: { id, applicationId, status: 'PROCESSING' },
        data: { status: 'SUCCEEDED', overallScore: new Prisma.Decimal(overallScore), completedAt, errorCode: null, errorMessage: null },
      });
      if (completed.count !== 1) throw new Error('Application match run could not be completed');

      const updatedApplication = await tx.application.updateMany({ where: { id: applicationId }, data: { currentMatchRunId: id } });
      if (updatedApplication.count !== 1) throw new Error('Application current match run could not be updated');
    });
  }

  findByIdWithResult(id: string) {
    return this.prisma.applicationMatchRun.findUnique({
      where: { id },
      include: {
        pipelineVersion: true,
        components: { orderBy: { componentCode: 'asc' } },
        skillResults: {
          include: { jobVersionSkill: { include: { skill: true } }, resumeSkill: true },
          orderBy: [{ status: 'asc' }, { jobVersionSkillId: 'asc' }],
        },
      },
    });
  }
}
