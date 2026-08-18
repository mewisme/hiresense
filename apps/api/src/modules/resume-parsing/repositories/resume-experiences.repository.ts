import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateResumeExperienceInput {
  companyName?: string | null;
  jobTitle?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isCurrent?: boolean;
  description?: string | null;
  experienceMonths?: number | null;
  ordinal: number;
  confidence?: number | null;
}

@Injectable()
export class ResumeExperiencesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createMany(parseRunId: string, items: CreateResumeExperienceInput[], db: DbClient = this.prisma) {
    if (items.length === 0) return { count: 0 };

    return db.resumeExperience.createMany({
      data: items.map((item) => ({
        parseRunId,
        companyName: item.companyName ?? null,
        jobTitle: item.jobTitle ?? null,
        startDate: item.startDate ?? null,
        endDate: item.endDate ?? null,
        isCurrent: item.isCurrent ?? false,
        description: item.description ?? null,
        experienceMonths: item.experienceMonths ?? null,
        ordinal: item.ordinal,
        confidence: item.confidence ?? null,
      })),
    });
  }

  findByParseRunId(parseRunId: string, db: DbClient = this.prisma) {
    return db.resumeExperience.findMany({
      where: { parseRunId },
      orderBy: { ordinal: 'asc' },
    });
  }
}