import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { ApplicationSource } from '../types/application-source.type';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateApplicationInput {
  jobId: string;
  jobVersionId: string;
  candidateProfileId: string;
  resumeVersionId: string;
  currentStageId: string;
  source?: ApplicationSource;
  coverLetter?: string | null;
}

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.application.findUnique({ where: { id } });
  }

  findByJobAndCandidate(jobId: string, candidateProfileId: string, db: DbClient = this.prisma) {
    return db.application.findUnique({
      where: { jobId_candidateProfileId: { jobId, candidateProfileId } },
    });
  }

  findCandidateOwnedById(id: string, candidateProfileId: string, db: DbClient = this.prisma) {
    return db.application.findFirst({
      where: { id, candidateProfileId },
    });
  }

  findByCandidateProfileId(candidateProfileId: string, db: DbClient = this.prisma) {
    return db.application.findMany({
      where: { candidateProfileId },
      include: {
        job: { include: { company: true } },
        jobVersion: true,
        currentStage: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  findCandidateOwnedByIdWithDetail(id: string, candidateProfileId: string, db: DbClient = this.prisma) {
    return db.application.findFirst({
      where: { id, candidateProfileId },
      include: {
        job: { include: { company: true } },
        jobVersion: {
          include: {
            skills: {
              include: { skill: true },
              orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
            },
          },
        },
        resumeVersion: { include: { resume: true } },
        currentStage: true,
      },
    });
  }

  findByJobId(jobId: string, db: DbClient = this.prisma) {
    return db.application.findMany({
      where: { jobId },
      include: {
        candidateProfile: true,
        resumeVersion: {
          include: { resume: true },
        },
        currentStage: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  findCandidateOwnedByIdWithStage(id: string, candidateProfileId: string, db: DbClient = this.prisma) {
    return db.application.findFirst({
      where: { id, candidateProfileId },
      include: { currentStage: true },
    });
  }

  create(input: CreateApplicationInput, db: DbClient = this.prisma) {
    return db.application.create({
      data: {
        jobId: input.jobId,
        jobVersionId: input.jobVersionId,
        candidateProfileId: input.candidateProfileId,
        resumeVersionId: input.resumeVersionId,
        currentStageId: input.currentStageId,
        source: input.source ?? 'DIRECT',
        coverLetter: input.coverLetter ?? null,
      },
    });
  }

  updateCurrentStage(id: string, currentStageId: string, db: DbClient = this.prisma) {
    return db.application.update({
      where: { id },
      data: { currentStageId },
    });
  }

  withdraw(id: string, currentStageId: string, withdrawnAt: Date, db: DbClient = this.prisma) {
    return db.application.update({
      where: { id },
      data: { currentStageId, withdrawnAt },
    });
  }

  async lockById(id: string, db: Prisma.TransactionClient): Promise<boolean> {
    const rows = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM applications WHERE id = CAST(${id} AS uuid) FOR UPDATE`,
    );

    return rows.length > 0;
  }

  async lockCandidateOwnedById(id: string, candidateProfileId: string, db: Prisma.TransactionClient): Promise<boolean> {
    const rows = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM applications
        WHERE id = CAST(${id} AS uuid)
          AND candidate_profile_id = CAST(${candidateProfileId} AS uuid)
        FOR UPDATE
      `,
    );
    return rows.length > 0;
  }
}