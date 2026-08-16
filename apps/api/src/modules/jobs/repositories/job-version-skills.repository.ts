import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

export interface CreateJobVersionSkillInput {
  jobVersionId: string;
  skillId: string;
  importance: number;
  isRequired: boolean;
  weight: Prisma.Decimal;
  minExperienceMonths?: number | null;
}

@Injectable()
export class JobVersionSkillsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByJobVersionId(jobVersionId: string, db: DbClient = this.prisma) {
    return db.jobVersionSkill.findMany({
      where: { jobVersionId },
      include: { skill: true },
      orderBy: [{ isRequired: 'desc' }, { importance: 'desc' }],
    });
  }

  async findActiveSkillIds(skillIds: string[], db: DbClient = this.prisma): Promise<string[]> {
    if (skillIds.length === 0) return [];

    const skills = await db.skill.findMany({
      where: { id: { in: skillIds }, isActive: true },
      select: { id: true },
    });

    return skills.map((skill) => skill.id);
  }

  createMany(inputs: CreateJobVersionSkillInput[], db: DbClient = this.prisma) {
    if (inputs.length === 0) return Promise.resolve({ count: 0 });

    return db.jobVersionSkill.createMany({
      data: inputs.map((input) => ({
        jobVersionId: input.jobVersionId,
        skillId: input.skillId,
        importance: input.importance,
        isRequired: input.isRequired,
        weight: input.weight,
        minExperienceMonths: input.minExperienceMonths ?? null,
      })),
    });
  }

  deleteByJobVersionId(jobVersionId: string, db: DbClient = this.prisma) {
    return db.jobVersionSkill.deleteMany({ where: { jobVersionId } });
  }
}