import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class SkillCategoriesRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.skillCategory.findUnique({
      where: { id },
    });
  }

  findByCode(code: string, db: DbClient = this.prisma) {
    return db.skillCategory.findUnique({
      where: { code },
    });
  }

  findAll(db: DbClient = this.prisma) {
    return db.skillCategory.findMany({
      orderBy: { code: 'asc' },
    });
  }
}