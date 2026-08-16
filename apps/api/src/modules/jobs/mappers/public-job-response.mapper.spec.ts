import { describe, expect, it } from '@jest/globals';
import { Prisma } from '../../../generated/prisma/client';
import { toPublicJobResponse } from './public-job-response.mapper';

const now = new Date('2026-08-16T00:00:00.000Z');
const companyId = '0198c8e8-0000-7000-8000-000000000001';
const userId = '0198c8e8-0000-7000-8000-000000000002';
const jobId = '0198c8e8-0000-7000-8000-000000000010';
const versionId = '0198c8e8-0000-7000-8000-000000000020';
const skillId = '0198c8e8-0000-7000-8000-000000000031';

function publicJob() {
  return {
    id: jobId,
    companyId,
    createdByUserId: userId,
    slug: 'backend-developer-12345678',
    status: 'PUBLISHED',
    currentPublishedVersionId: versionId,
    firstPublishedAt: now,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    company: {
      id: companyId,
      name: 'HireSense Company',
      slug: 'hiresense-company',
      description: 'Software company',
      websiteUrl: 'https://example.com',
      companySizeMin: 10,
      companySizeMax: 50,
      status: 'ACTIVE',
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  };
}

function publicVersion() {
  return {
    id: versionId,
    jobId,
    versionNo: 1,
    versionStatus: 'PUBLISHED',
    title: 'Backend Developer',
    summary: 'Backend position',
    description: 'Develop backend services.',
    responsibilities: 'Build APIs and write tests.',
    benefits: 'Flexible working.',
    employmentType: 'FULL_TIME',
    workplaceType: 'HYBRID',
    experienceMinMonths: 12,
    experienceMaxMonths: 36,
    salaryMin: new Prisma.Decimal('15000000.0000'),
    salaryMax: new Prisma.Decimal('30000000.0000'),
    salaryCurrency: 'VND',
    createdByUserId: userId,
    publishedAt: now,
    createdAt: now,
    skills: [
      {
        id: '0198c8e8-0000-7000-8000-000000000030',
        jobVersionId: versionId,
        skillId,
        importance: 5,
        isRequired: true,
        weight: new Prisma.Decimal('1.000000'),
        minExperienceMonths: 12,
        createdAt: now,
        skill: {
          id: skillId,
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

describe('public-job-response.mapper', () => {
  describe('toPublicJobResponse', () => {
    it('maps public job identity and lifecycle fields', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.id).toBe(jobId);
      expect(result.slug).toBe('backend-developer-12345678');
      expect(result.status).toBe('PUBLISHED');
      expect(result.firstPublishedAt).toBe(now);
    });

    it('maps safe public company fields', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.company).toEqual({
        id: companyId,
        name: 'HireSense Company',
        slug: 'hiresense-company',
        description: 'Software company',
        websiteUrl: 'https://example.com',
      });
    });

    it('does not expose company internal fields', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.company).not.toHaveProperty('createdByUserId');
      expect(result.company).not.toHaveProperty('deletedAt');
      expect(result.company).not.toHaveProperty('status');
      expect(result.company).not.toHaveProperty('createdAt');
      expect(result.company).not.toHaveProperty('updatedAt');
    });

    it('maps the exact published version snapshot', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.version).toEqual(expect.objectContaining({
        id: versionId,
        versionNo: 1,
        title: 'Backend Developer',
        summary: 'Backend position',
        description: 'Develop backend services.',
        responsibilities: 'Build APIs and write tests.',
        benefits: 'Flexible working.',
        employmentType: 'FULL_TIME',
        workplaceType: 'HYBRID',
        experienceMinMonths: 12,
        experienceMaxMonths: 36,
        salaryCurrency: 'VND',
        publishedAt: now,
      }));
    });

    it('converts salary Decimal values to strings', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.version.salaryMin).toBe('15000000');
      expect(result.version.salaryMax).toBe('30000000');
      expect(typeof result.version.salaryMin).toBe('string');
      expect(typeof result.version.salaryMax).toBe('string');
    });

    it('keeps nullable salary values as null', () => {
      const result = toPublicJobResponse(publicJob(), {
        ...publicVersion(),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
      });

      expect(result.version.salaryMin).toBeNull();
      expect(result.version.salaryMax).toBeNull();
      expect(result.version.salaryCurrency).toBeNull();
    });

    it('maps canonical job skills', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.version.skills).toEqual([
        {
          skillId,
          name: 'NestJS',
          importance: 5,
          isRequired: true,
          weight: '1',
          minExperienceMonths: 12,
        },
      ]);
    });

    it('converts skill weight Decimal to string', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.version.skills[0]?.weight).toBe('1');
      expect(typeof result.version.skills[0]?.weight).toBe('string');
    });

    it('supports a published job version without skills', () => {
      const result = toPublicJobResponse(publicJob(), {
        ...publicVersion(),
        skills: [],
      });

      expect(result.version.skills).toEqual([]);
    });

    it('does not expose Job internal ownership fields', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result).not.toHaveProperty('companyId');
      expect(result).not.toHaveProperty('createdByUserId');
      expect(result).not.toHaveProperty('currentPublishedVersionId');
      expect(result).not.toHaveProperty('closedAt');
      expect(result).not.toHaveProperty('deletedAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('does not expose JobVersion internal fields', () => {
      const result = toPublicJobResponse(publicJob(), publicVersion());

      expect(result.version).not.toHaveProperty('jobId');
      expect(result.version).not.toHaveProperty('createdByUserId');
      expect(result.version).not.toHaveProperty('versionStatus');
      expect(result.version).not.toHaveProperty('createdAt');
    });
  });
});