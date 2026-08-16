import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateSkillInput {
  categoryId?: string;
  name: string;
  normalizedName: string;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class SkillsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.skill.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  findByNormalizedName(normalizedName: string, db: DbClient = this.prisma) {
    return db.skill.findUnique({
      where: { normalizedName },
      include: { category: true },
    });
  }

  findAllActive(db: DbClient = this.prisma) {
    return db.skill.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  findActiveByCategoryId(categoryId: string, db: DbClient = this.prisma) {
    return db.skill.findMany({
      where: { categoryId, isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  create(input: CreateSkillInput, db: DbClient = this.prisma) {
    return db.skill.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        normalizedName: input.normalizedName,
        description: input.description,
        isActive: input.isActive ?? true,
      },
      include: { category: true },
    });
  }
}