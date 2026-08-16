import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { JobStatus } from '../types/job-status.type';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateJobInput {
  companyId: string;
  createdByUserId: string;
  slug: string;
  status?: JobStatus;
}

@Injectable()
export class JobsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.job.findUnique({ where: { id } });
  }

  findActiveById(id: string, db: DbClient = this.prisma) {
    return db.job.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveOwnedById(id: string, companyId: string, db: DbClient = this.prisma) {
    return db.job.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  findByCompanyAndSlug(companyId: string, slug: string, db: DbClient = this.prisma) {
    return db.job.findUnique({ where: { companyId_slug: { companyId, slug } } });
  }

  findByCompanyId(companyId: string, db: DbClient = this.prisma) {
    return db.job.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findPublicPublished(companyId?: string, db: DbClient = this.prisma) {
    return db.job.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        currentPublishedVersionId: { not: null },
        ...(companyId ? { companyId } : {}),
        company: { status: 'ACTIVE', deletedAt: null },
      },
      include: { company: true },
      orderBy: { firstPublishedAt: 'desc' },
    });
  }

  findPublicPublishedById(id: string, db: DbClient = this.prisma) {
    return db.job.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
        deletedAt: null,
        currentPublishedVersionId: { not: null },
        company: { status: 'ACTIVE', deletedAt: null },
      },
      include: { company: true },
    });
  }

  create(input: CreateJobInput, db: DbClient = this.prisma) {
    return db.job.create({
      data: {
        companyId: input.companyId,
        createdByUserId: input.createdByUserId,
        slug: input.slug,
        status: input.status ?? 'DRAFT',
      },
    });
  }

  updateStatus(id: string, status: JobStatus, db: DbClient = this.prisma) {
    return db.job.update({ where: { id }, data: { status } });
  }

  publish(id: string, versionId: string, publishedAt: Date, firstPublishedAt: Date, db: DbClient = this.prisma) {
    return db.job.update({
      where: { id },
      data: {
        currentPublishedVersionId: versionId,
        status: 'PUBLISHED',
        firstPublishedAt,
        closedAt: null,
      },
    });
  }

  pausePublished(id: string, db: DbClient = this.prisma) {
    return db.job.updateMany({
      where: { id, status: 'PUBLISHED', deletedAt: null },
      data: { status: 'PAUSED' },
    });
  }

  closePublishedOrPaused(id: string, closedAt: Date, db: DbClient = this.prisma) {
    return db.job.updateMany({
      where: { id, status: { in: ['PUBLISHED', 'PAUSED'] }, deletedAt: null },
      data: { status: 'CLOSED', closedAt },
    });
  }

  reopenPausedOrClosed(id: string, db: DbClient = this.prisma) {
    return db.job.updateMany({
      where: {
        id,
        status: { in: ['PAUSED', 'CLOSED'] },
        currentPublishedVersionId: { not: null },
        deletedAt: null,
      },
      data: { status: 'PUBLISHED', closedAt: null },
    });
  }

  archiveDraftOrClosed(id: string, db: DbClient = this.prisma) {
    return db.job.updateMany({
      where: { id, status: { in: ['DRAFT', 'CLOSED'] }, deletedAt: null },
      data: { status: 'ARCHIVED' },
    });
  }

  softDeleteDraftClosedOrArchived(id: string, deletedAt: Date, db: DbClient = this.prisma) {
    return db.job.updateMany({
      where: { id, status: { in: ['DRAFT', 'CLOSED', 'ARCHIVED'] }, deletedAt: null },
      data: { status: 'ARCHIVED', deletedAt },
    });
  }

  async lockActiveOwnedById(id: string, companyId: string, db: Prisma.TransactionClient): Promise<boolean> {
    const rows = await db.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM jobs WHERE id = CAST(${id} AS uuid) AND company_id = CAST(${companyId} AS uuid) AND deleted_at IS NULL FOR UPDATE`,
    );

    return rows.length > 0;
  }
}