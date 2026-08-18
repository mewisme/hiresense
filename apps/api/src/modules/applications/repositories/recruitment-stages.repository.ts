import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { SystemRecruitmentStageCode } from '../types/recruitment-stage.type';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class RecruitmentStagesRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.recruitmentStage.findUnique({ where: { id } });
  }

  findActiveSystemByCode(code: SystemRecruitmentStageCode, db: DbClient = this.prisma) {
    return db.recruitmentStage.findFirst({
      where: { companyId: null, code, isActive: true },
    });
  }

  findActiveForCompanyById(id: string, companyId: string, db: DbClient = this.prisma) {
    return db.recruitmentStage.findFirst({
      where: {
        id,
        isActive: true,
        OR: [{ companyId: null }, { companyId }],
      },
    });
  }

  findActiveForCompany(companyId: string, db: DbClient = this.prisma) {
    return db.recruitmentStage.findMany({
      where: {
        isActive: true,
        OR: [{ companyId: null }, { companyId }],
      },
      orderBy: [{ ordinal: 'asc' }, { code: 'asc' }],
    });
  }
}