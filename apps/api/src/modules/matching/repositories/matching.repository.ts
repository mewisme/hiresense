import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class MatchingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findApplicationSource(applicationId: string, db: DbClient = this.prisma) {
    return db.application.findUnique({
      where: { id: applicationId },
      select: { id: true, jobVersionId: true, resumeVersionId: true },
    });
  }

  findJobVersionRequirements(jobVersionId: string, db: DbClient = this.prisma) {
    return db.jobVersion.findUnique({
      where: { id: jobVersionId },
      select: {
        id: true,
        jobId: true,
        versionNo: true,
        versionStatus: true,
        experienceMinMonths: true,
        experienceMaxMonths: true,
        skills: {
          select: {
            id: true,
            jobVersionId: true,
            skillId: true,
            importance: true,
            isRequired: true,
            weight: true,
            minExperienceMonths: true,
            skill: { select: { id: true, name: true, normalizedName: true } },
          },
          orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }, { skillId: 'asc' }],
        },
      },
    });
  }
}
