import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma as PrismaNamespace } from '../../generated/prisma/client';
import { SkillCategoriesRepository } from './repositories/skill-categories.repository';
import { SkillsRepository } from './repositories/skills.repository';
import { normalizeSkillName } from './utils/skill-name.util';

export interface CreateCanonicalSkillInput {
  name: string;
  categoryId?: string;
  description?: string;
}

export type SkillWithCategory = NonNullable<
  Awaited<ReturnType<SkillsRepository['findByNormalizedName']>>
>;

@Injectable()
export class SkillsService {
  constructor(
    private readonly skillCategoriesRepository: SkillCategoriesRepository,
    private readonly skillsRepository: SkillsRepository,
  ) { }

  listCategories() {
    return this.skillCategoriesRepository.findAll();
  }

  listActiveSkills(categoryId?: string) {
    if (categoryId) {
      return this.skillsRepository.findActiveByCategoryId(categoryId);
    }

    return this.skillsRepository.findAllActive();
  }

  async getSkillById(skillId: string): Promise<SkillWithCategory> {
    const skill = await this.skillsRepository.findById(skillId);

    if (!skill || !skill.isActive) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  async resolveCanonicalSkill(name: string): Promise<SkillWithCategory> {
    const normalizedName = normalizeSkillName(name);

    if (!normalizedName) {
      throw new BadRequestException('Skill name cannot be empty');
    }

    const skill = await this.skillsRepository.findByNormalizedName(normalizedName);

    if (!skill || !skill.isActive) {
      throw new NotFoundException('Canonical skill not found');
    }

    return skill;
  }

  async createCanonicalSkill(input: CreateCanonicalSkillInput): Promise<SkillWithCategory> {
    const name = input.name.trim();
    const normalizedName = normalizeSkillName(name);

    if (!normalizedName) {
      throw new BadRequestException('Skill name cannot be empty');
    }

    if (input.categoryId) {
      const category = await this.skillCategoriesRepository.findById(input.categoryId);

      if (!category) {
        throw new NotFoundException('Skill category not found');
      }
    }

    try {
      return await this.skillsRepository.create({
        name,
        normalizedName,
        categoryId: input.categoryId,
        description: input.description,
        isActive: true,
      });
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Skill already exists');
      }

      throw error;
    }
  }
}