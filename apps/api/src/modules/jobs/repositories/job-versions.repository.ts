import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateJobVersionInput {
  jobId: string;
  versionNo: number;
  title: string;
  summary?: string | null;
  description: string;
  responsibilities?: string | null;
  benefits?: string | null;
  employmentType?: string | null;
  workplaceType?: string | null;
  experienceMinMonths?: number | null;
  experienceMaxMonths?: number | null;
  salaryMin?: Prisma.Decimal | null;
  salaryMax?: Prisma.Decimal | null;
  salaryCurrency?: string | null;
  createdByUserId: string;
}

export interface UpdateDraftJobVersionInput {
  title?: string;
  summary?: string | null;
  description?: string;
  responsibilities?: string | null;
  benefits?: string | null;
  employmentType?: string | null;
  workplaceType?: string | null;
  experienceMinMonths?: number | null;
  experienceMaxMonths?: number | null;
  salaryMin?: Prisma.Decimal | null;
  salaryMax?: Prisma.Decimal | null;
  salaryCurrency?: string | null;
}

export interface PublicJobVersionsQuery {
  q?: string;
  employmentType?: string;
  workplaceType?: string;
  skillId?: string;
  skip: number;
  take: number;
}

@Injectable()
export class JobVersionsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findById(id: string, db: DbClient = this.prisma) {
    return db.jobVersion.findUnique({ where: { id } });
  }

  findByJobAndId(jobId: string, id: string, db: DbClient = this.prisma) {
    return db.jobVersion.findFirst({ where: { id, jobId } });
  }

  findByJobId(jobId: string, db: DbClient = this.prisma) {
    return db.jobVersion.findMany({
      where: { jobId },
      orderBy: { versionNo: 'desc' },
    });
  }

  findLatestByJobId(jobId: string, db: DbClient = this.prisma) {
    return db.jobVersion.findFirst({
      where: { jobId },
      orderBy: { versionNo: 'desc' },
    });
  }

  findLatestDraftByJobId(jobId: string, db: DbClient = this.prisma) {
    return db.jobVersion.findFirst({
      where: { jobId, versionStatus: 'DRAFT' },
      orderBy: { versionNo: 'desc' },
    });
  }

  findPublishedById(id: string, db: DbClient = this.prisma) {
    return db.jobVersion.findFirst({
      where: { id, versionStatus: 'PUBLISHED', publishedAt: { not: null } },
    });
  }

  findByIdWithSkills(id: string, db: DbClient = this.prisma) {
    return db.jobVersion.findUnique({
      where: { id },
      include: {
        skills: {
          include: { skill: true },
          orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
        },
      },
    });
  }

  findByIds(ids: string[], db: DbClient = this.prisma) {
    if (ids.length === 0) return db.jobVersion.findMany({ where: { id: { in: [] } } });
    return db.jobVersion.findMany({ where: { id: { in: ids } } });
  }

  findDraftsByJobIds(jobIds: string[], db: DbClient = this.prisma) {
    if (jobIds.length === 0) return db.jobVersion.findMany({ where: { jobId: { in: [] } } });

    return db.jobVersion.findMany({
      where: { jobId: { in: jobIds }, versionStatus: 'DRAFT' },
      orderBy: [{ jobId: 'asc' }, { versionNo: 'desc' }],
    });
  }

  findByJobAndIdWithSkills(jobId: string, id: string, db: DbClient = this.prisma) {
    return db.jobVersion.findFirst({
      where: { id, jobId },
      include: {
        skills: {
          include: { skill: true },
          orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
        },
      },
    });
  }

  findLatestDraftByJobIdWithSkills(jobId: string, db: DbClient = this.prisma) {
    return db.jobVersion.findFirst({
      where: { jobId, versionStatus: 'DRAFT' },
      include: {
        skills: {
          include: { skill: true },
          orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
        },
      },
      orderBy: { versionNo: 'desc' },
    });
  }

  findByJobAndOptionalIdWithSkills(jobId: string, id: string | null, db: DbClient = this.prisma) {
    if (!id) {
      return db.jobVersion.findFirst({
        where: { id: { equals: undefined }, jobId },
        include: {
          skills: {
            include: { skill: true },
            orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
          },
        },
      });
    }

    return this.findByJobAndIdWithSkills(jobId, id, db);
  }

  findPublicCurrentVersions(versionIds: string[], query: PublicJobVersionsQuery, db: DbClient = this.prisma) {
    return db.jobVersion.findMany({
      where: this.createPublicWhere(versionIds, query),
      include: {
        skills: {
          include: { skill: true },
          orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: query.skip,
      take: query.take,
    });
  }

  findPublishedByJobAndIdWithSkills(jobId: string, id: string, db: DbClient = this.prisma) {
    return db.jobVersion.findFirst({
      where: {
        id,
        jobId,
        versionStatus: 'PUBLISHED',
        publishedAt: { not: null },
      },
      include: {
        skills: {
          include: { skill: true },
          orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
        },
      },
    });
  }

  countPublicCurrentVersions(versionIds: string[], query: PublicJobVersionsQuery, db: DbClient = this.prisma) {
    return db.jobVersion.count({ where: this.createPublicWhere(versionIds, query) });
  }

  async getNextVersionNo(jobId: string, db: DbClient = this.prisma): Promise<number> {
    const latest = await db.jobVersion.findFirst({
      where: { jobId },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true },
    });

    return (latest?.versionNo ?? 0) + 1;
  }

  create(input: CreateJobVersionInput, db: DbClient = this.prisma) {
    return db.jobVersion.create({
      data: {
        jobId: input.jobId,
        versionNo: input.versionNo,
        versionStatus: 'DRAFT',
        title: input.title,
        summary: input.summary ?? null,
        description: input.description,
        responsibilities: input.responsibilities ?? null,
        benefits: input.benefits ?? null,
        employmentType: input.employmentType ?? null,
        workplaceType: input.workplaceType ?? null,
        experienceMinMonths: input.experienceMinMonths ?? null,
        experienceMaxMonths: input.experienceMaxMonths ?? null,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        salaryCurrency: input.salaryCurrency ?? null,
        createdByUserId: input.createdByUserId,
      },
    });
  }

  updateDraft(id: string, input: UpdateDraftJobVersionInput, db: DbClient = this.prisma) {
    return db.jobVersion.updateMany({
      where: { id, versionStatus: 'DRAFT' },
      data: input,
    });
  }

  publishDraft(id: string, publishedAt: Date, db: DbClient = this.prisma) {
    return db.jobVersion.updateMany({
      where: { id, versionStatus: 'DRAFT', publishedAt: null },
      data: { versionStatus: 'PUBLISHED', publishedAt },
    });
  }

  private createPublicWhere(versionIds: string[], query: PublicJobVersionsQuery): Prisma.JobVersionWhereInput {
    return {
      id: { in: versionIds },
      versionStatus: 'PUBLISHED',
      publishedAt: { not: null },
      ...(query.employmentType ? { employmentType: query.employmentType } : {}),
      ...(query.workplaceType ? { workplaceType: query.workplaceType } : {}),
      ...(query.skillId ? { skills: { some: { skillId: query.skillId } } } : {}),
      ...(query.q ? {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { summary: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ],
      } : {}),
    };
  }
}