import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateResumeEducationInput {
  institutionName?: string | null;
  degree?: string | null;
  fieldOfStudy?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  description?: string | null;
  ordinal: number;
  confidence?: number | null;
}

@Injectable()
export class ResumeEducationsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createMany(parseRunId: string, items: CreateResumeEducationInput[], db: DbClient = this.prisma) {
    if (items.length === 0) return { count: 0 };

    return db.resumeEducation.createMany({
      data: items.map((item) => ({
        parseRunId,
        institutionName: item.institutionName ?? null,
        degree: item.degree ?? null,
        fieldOfStudy: item.fieldOfStudy ?? null,
        startDate: item.startDate ?? null,
        endDate: item.endDate ?? null,
        description: item.description ?? null,
        ordinal: item.ordinal,
        confidence: item.confidence ?? null,
      })),
    });
  }

  findByParseRunId(parseRunId: string, db: DbClient = this.prisma) {
    return db.resumeEducation.findMany({
      where: { parseRunId },
      orderBy: { ordinal: 'asc' },
    });
  }
}