import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AiPipelineVersionsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findActiveByCode(code: string, db: DbClient = this.prisma) {
    return db.aiPipelineVersion.findFirst({
      where: { code, isActive: true },
    });
  }

  findActiveByCodeAndType(code: string, pipelineType: string, db: DbClient = this.prisma) {
    return db.aiPipelineVersion.findFirst({
      where: { code, pipelineType, isActive: true },
    });
  }
}