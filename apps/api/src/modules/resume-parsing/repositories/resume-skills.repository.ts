import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateResumeSkillInput {
  skillId: string;
  confidence?: number | null;
  evidenceText?: string | null;
}

@Injectable()
export class ResumeSkillsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createMany(parseRunId: string, items: CreateResumeSkillInput[], db: DbClient = this.prisma) {
    if (items.length === 0) return { count: 0 };

    return db.resumeSkill.createMany({
      data: items.map((item) => ({
        parseRunId,
        skillId: item.skillId,
        confidence: item.confidence ?? null,
        evidenceText: item.evidenceText ?? null,
      })),
      skipDuplicates: true,
    });
  }

  findByParseRunId(parseRunId: string, db: DbClient = this.prisma) {
    return db.resumeSkill.findMany({
      where: { parseRunId },
      include: { skill: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}