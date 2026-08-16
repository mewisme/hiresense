import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class JobCompanyMembershipsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByCompanyAndUser(companyId: string, userId: string, db: DbClient = this.prisma) {
    return db.companyMembership.findUnique({ where: { companyId_userId: { companyId, userId } } });
  }
}