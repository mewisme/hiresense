import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateResumeVersionInput {
  resumeId: string;
  versionNo: number;
  fileObjectId: string;
  createdByUserId: string;
}

@Injectable()
export class ResumeVersionsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.resumeVersion.findUnique({ where: { id } });
  }

  findOwnedById(id: string, resumeId: string, db: DbClient = this.prisma) {
    return db.resumeVersion.findFirst({
      where: { id, resumeId },
      include: { fileObject: true },
    });
  }

  findByResumeId(resumeId: string, db: DbClient = this.prisma) {
    return db.resumeVersion.findMany({
      where: { resumeId },
      include: { fileObject: true },
      orderBy: { versionNo: 'desc' },
    });
  }

  findByIds(ids: string[], db: DbClient = this.prisma) {
    if (ids.length === 0) return Promise.resolve([]);
    return db.resumeVersion.findMany({
      where: { id: { in: ids } },
      include: { fileObject: true },
    });
  }

  findLatestByResumeId(resumeId: string, db: DbClient = this.prisma) {
    return db.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNo: 'desc' },
    });
  }

  async getNextVersionNo(resumeId: string, db: DbClient = this.prisma): Promise<number> {
    const latest = await db.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true },
    });

    return (latest?.versionNo ?? 0) + 1;
  }

  create(input: CreateResumeVersionInput, db: DbClient = this.prisma) {
    return db.resumeVersion.create({
      data: {
        resumeId: input.resumeId,
        versionNo: input.versionNo,
        fileObjectId: input.fileObjectId,
        createdByUserId: input.createdByUserId,
      },
    });
  }
}