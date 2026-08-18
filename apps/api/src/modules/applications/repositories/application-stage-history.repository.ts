import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateApplicationStageHistoryInput {
  applicationId: string;
  fromStageId?: string | null;
  toStageId: string;
  changedByUserId?: string | null;
  note?: string | null;
}

@Injectable()
export class ApplicationStageHistoryRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByApplicationId(applicationId: string, db: DbClient = this.prisma) {
    return db.applicationStageHistory.findMany({
      where: { applicationId },
      include: {
        fromStage: true,
        toStage: true,
        changedBy: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findCandidateVisibleByApplicationId(applicationId: string, db: DbClient = this.prisma) {
    return db.applicationStageHistory.findMany({
      where: { applicationId },
      include: {
        fromStage: true,
        toStage: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(input: CreateApplicationStageHistoryInput, db: DbClient = this.prisma) {
    return db.applicationStageHistory.create({
      data: {
        applicationId: input.applicationId,
        fromStageId: input.fromStageId ?? null,
        toStageId: input.toStageId,
        changedByUserId: input.changedByUserId ?? null,
        note: input.note ?? null,
      },
    });
  }
}