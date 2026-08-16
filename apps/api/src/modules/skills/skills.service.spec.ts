import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { SkillCategoriesRepository } from './repositories/skill-categories.repository';
import type { SkillsRepository } from './repositories/skills.repository';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  function createService(input?: {
    category?: Record<string, unknown> | null;
    skill?: Record<string, unknown> | null;
  }) {
    const category = input?.category ?? null;
    const skill = input?.skill ?? null;

    const skillCategoriesRepository = {
      findAll: jest.fn(async () => []),
      findById: jest.fn(async () => category),
    } as unknown as SkillCategoriesRepository;

    const skillsRepository = {
      findById: jest.fn(async () => skill),
      findByNormalizedName: jest.fn(async () => skill),
      findAllActive: jest.fn(async () => []),
      findActiveByCategoryId: jest.fn(async () => []),
      create: jest.fn(async (data) => ({
        id: 'skill-id',
        ...(data as Record<string, unknown>),
        category: category ?? null,
      })),
    } as unknown as SkillsRepository;

    return {
      service: new SkillsService(skillCategoriesRepository, skillsRepository),
      skillCategoriesRepository,
      skillsRepository,
    };
  }

  it('should resolve a canonical skill by normalized name', async () => {
    const { service, skillsRepository } = createService({
      skill: {
        id: 'skill-id',
        name: 'PostgreSQL',
        normalizedName: 'postgresql',
        isActive: true,
        category: null,
      },
    });

    const result = await service.resolveCanonicalSkill('  PostgreSQL  ');

    expect(result.normalizedName).toBe('postgresql');
    expect(skillsRepository.findByNormalizedName).toHaveBeenCalledWith('postgresql');
  });

  it('should reject an unknown canonical skill', async () => {
    const { service } = createService();

    await expect(service.resolveCanonicalSkill('Unknown Skill')).rejects.toThrow(NotFoundException);
  });

  it('should reject an inactive skill', async () => {
    const { service } = createService({
      skill: {
        id: 'skill-id',
        name: 'Legacy Skill',
        normalizedName: 'legacy skill',
        isActive: false,
      },
    });

    await expect(service.resolveCanonicalSkill('Legacy Skill')).rejects.toThrow(NotFoundException);
  });

  it('should reject an empty normalized name', async () => {
    const { service } = createService();

    await expect(service.resolveCanonicalSkill('   ')).rejects.toThrow(BadRequestException);
  });

  it('should create a canonical skill', async () => {
    const { service, skillsRepository } = createService({
      category: {
        id: 'category-id',
        code: 'DATABASE',
      },
    });

    await service.createCanonicalSkill({
      name: '  PostgreSQL  ',
      categoryId: 'category-id',
      description: 'Relational database',
    });

    expect(skillsRepository.create).toHaveBeenCalledWith({
      name: 'PostgreSQL',
      normalizedName: 'postgresql',
      categoryId: 'category-id',
      description: 'Relational database',
      isActive: true,
    });
  });

  it('should reject an unknown category', async () => {
    const { service } = createService({ category: null });

    await expect(
      service.createCanonicalSkill({
        name: 'PostgreSQL',
        categoryId: 'missing-category-id',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});