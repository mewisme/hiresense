import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateResumeInput {
  candidateProfileId: string;
  name: string;
  isDefault?: boolean;
}

@Injectable()
export class ResumesRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.resume.findUnique({ where: { id } });
  }

  findActiveOwnedById(id: string, candidateProfileId: string, db: DbClient = this.prisma) {
    return db.resume.findFirst({ where: { id, candidateProfileId, deletedAt: null } });
  }

  findByCandidateProfileId(candidateProfileId: string, db: DbClient = this.prisma) {
    return db.resume.findMany({
      where: { candidateProfileId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  findMostRecentActive(candidateProfileId: string, db: DbClient = this.prisma) {
    return db.resume.findFirst({
      where: { candidateProfileId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  countActiveByCandidateProfileId(candidateProfileId: string, db: DbClient = this.prisma) {
    return db.resume.count({ where: { candidateProfileId, deletedAt: null } });
  }

  create(input: CreateResumeInput, db: DbClient = this.prisma) {
    return db.resume.create({
      data: {
        candidateProfileId: input.candidateProfileId,
        name: input.name,
        isDefault: input.isDefault ?? false,
      },
    });
  }

  setCurrentVersion(id: string, currentVersionId: string, db: DbClient = this.prisma) {
    return db.resume.update({ where: { id }, data: { currentVersionId } });
  }

  clearDefaults(candidateProfileId: string, db: DbClient = this.prisma) {
    return db.resume.updateMany({
      where: { candidateProfileId, deletedAt: null, isDefault: true },
      data: { isDefault: false },
    });
  }

  setDefault(id: string, db: DbClient = this.prisma) {
    return db.resume.update({ where: { id }, data: { isDefault: true } });
  }

  softDelete(id: string, db: DbClient = this.prisma) {
    return db.resume.update({ where: { id }, data: { isDefault: false, deletedAt: new Date() } });
  }

  async lockCandidateProfile(candidateProfileId: string, db: Prisma.TransactionClient): Promise<boolean> {
    const rows = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM candidate_profiles WHERE id = CAST(${candidateProfileId} AS uuid) FOR UPDATE`,
    );

    return rows.length > 0;
  }

  async lockActiveOwnedById(id: string, candidateProfileId: string, db: Prisma.TransactionClient): Promise<boolean> {
    const rows = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM resumes WHERE id = CAST(${id} AS uuid) AND candidate_profile_id = CAST(${candidateProfileId} AS uuid) AND deleted_at IS NULL FOR UPDATE`,
    );

    return rows.length > 0;
  }
}