import { describe, expect, it } from '@jest/globals';
import { Prisma } from '../../../generated/prisma/client';
import { toJobResponse, toJobVersionResponse, toJobVersionWithSkillsResponse } from './job-response.mapper';

const now = new Date('2026-08-16T00:00:00.000Z');

function job() {
  return {
    id: '0198c8e8-0000-7000-8000-000000000010',
    companyId: '0198c8e8-0000-7000-8000-000000000001',
    createdByUserId: '0198c8e8-0000-7000-8000-000000000002',
    slug: 'backend-developer-12345678',
    status: 'PUBLISHED',
    currentPublishedVersionId: '0198c8e8-0000-7000-8000-000000000020',
    firstPublishedAt: now,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function version() {
  return {
    id: '0198c8e8-0000-7000-8000-000000000020',
    jobId: '0198c8e8-0000-7000-8000-000000000010',
    versionNo: 1,
    versionStatus: 'PUBLISHED',
    title: 'Backend Developer',
    summary: 'Backend position',
    description: 'Develop backend services.',
    responsibilities: 'Build APIs.',
    benefits: 'Flexible working.',
    employmentType: 'FULL_TIME',
    workplaceType: 'HYBRID',
    experienceMinMonths: 12,
    experienceMaxMonths: 36,
    educationMinLevel: 'BACHELOR',
    salaryMin: new Prisma.Decimal('15000000.0000'),
    salaryMax: new Prisma.Decimal('30000000.0000'),
    salaryCurrency: 'VND',
    createdByUserId: '0198c8e8-0000-7000-8000-000000000002',
    publishedAt: now,
    createdAt: now,
  };
}

function versionWithSkills() {
  return {
    ...version(),
    skills: [
      {
        id: '0198c8e8-0000-7000-8000-000000000030',
        jobVersionId: '0198c8e8-0000-7000-8000-000000000020',
        skillId: '0198c8e8-0000-7000-8000-000000000031',
        importance: 5,
        isRequired: true,
        weight: new Prisma.Decimal('1.000000'),
        minExperienceMonths: 12,
        createdAt: now,
        skill: {
          id: '0198c8e8-0000-7000-8000-000000000031',
          categoryId: null,
          name: 'NestJS',
          normalizedName: 'nestjs',
          description: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      },
    ],
  };
}

describe('job-response.mapper', () => {
  describe('toJobResponse', () => {
    it('maps job lifecycle fields', () => {
      const source = job();
      const result = toJobResponse(source);

      expect(result).toEqual({
        id: source.id,
        companyId: source.companyId,
        createdByUserId: source.createdByUserId,
        slug: source.slug,
        status: 'PUBLISHED',
        currentPublishedVersionId: source.currentPublishedVersionId,
        firstPublishedAt: now,
        closedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    });

    it('does not expose deletedAt', () => {
      const result = toJobResponse(job());

      expect(result).not.toHaveProperty('deletedAt');
    });
  });

  describe('toJobVersionResponse', () => {
    it('returns null when version is null', () => {
      expect(toJobVersionResponse(null)).toBeNull();
    });

    it('maps job version fields', () => {
      const source = version();
      const result = toJobVersionResponse(source);

      expect(result).toEqual({
        id: source.id,
        jobId: source.jobId,
        versionNo: 1,
        versionStatus: 'PUBLISHED',
        title: 'Backend Developer',
        summary: 'Backend position',
        description: 'Develop backend services.',
        responsibilities: 'Build APIs.',
        benefits: 'Flexible working.',
        employmentType: 'FULL_TIME',
        workplaceType: 'HYBRID',
        experienceMinMonths: 12,
        experienceMaxMonths: 36,
        educationMinLevel: 'BACHELOR',
        salaryMin: '15000000',
        salaryMax: '30000000',
        salaryCurrency: 'VND',
        createdByUserId: source.createdByUserId,
        publishedAt: now,
        createdAt: now,
      });
    });

    it('converts Prisma Decimal salary values to strings', () => {
      const result = toJobVersionResponse(version());

      expect(typeof result?.salaryMin).toBe('string');
      expect(typeof result?.salaryMax).toBe('string');
      expect(result?.salaryMin).toBe('15000000');
      expect(result?.salaryMax).toBe('30000000');
    });

    it('keeps nullable salary fields as null', () => {
      const source = {
        ...version(),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
      };

      const result = toJobVersionResponse(source);

      expect(result?.salaryMin).toBeNull();
      expect(result?.salaryMax).toBeNull();
      expect(result?.salaryCurrency).toBeNull();
    });
  });

  describe('toJobVersionWithSkillsResponse', () => {
    it('returns null when version is null', () => {
      expect(toJobVersionWithSkillsResponse(null)).toBeNull();
    });

    it('maps canonical job skills', () => {
      const result = toJobVersionWithSkillsResponse(versionWithSkills());

      expect(result?.skills).toEqual([
        {
          id: '0198c8e8-0000-7000-8000-000000000030',
          skillId: '0198c8e8-0000-7000-8000-000000000031',
          name: 'NestJS',
          importance: 5,
          isRequired: true,
          weight: '1',
          minExperienceMonths: 12,
        },
      ]);
    });

    it('converts skill weight Decimal to string', () => {
      const result = toJobVersionWithSkillsResponse(versionWithSkills());

      expect(typeof result?.skills[0]?.weight).toBe('string');
      expect(result?.skills[0]?.weight).toBe('1');
    });

    it('preserves version salary conversion when skills are included', () => {
      const result = toJobVersionWithSkillsResponse(versionWithSkills());

      expect(result?.salaryMin).toBe('15000000');
      expect(result?.salaryMax).toBe('30000000');
    });

    it('supports a version without skills', () => {
      const result = toJobVersionWithSkillsResponse({
        ...versionWithSkills(),
        skills: [],
      });

      expect(result?.skills).toEqual([]);
    });
  });
});