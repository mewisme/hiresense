import { describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '../../../generated/prisma/client';
import { MatchingRepository } from '../repositories/matching.repository';
import { JobSkillRequirementsService } from './job-skill-requirements.service';

interface MockRequirementSnapshot {
  id: string;
  jobId: string;
  versionNo: number;
  versionStatus: string;
  experienceMinMonths: number | null;
  experienceMaxMonths: number | null;
  skills: Array<{
    id: string;
    jobVersionId: string;
    skillId: string;
    importance: number;
    isRequired: boolean;
    weight: Prisma.Decimal;
    minExperienceMonths: number | null;
    skill: { id: string; name: string; normalizedName: string };
  }>;
}

function snapshot(): MockRequirementSnapshot {
  return {
    id: '0198c8e8-0000-7000-8000-000000000020',
    jobId: '0198c8e8-0000-7000-8000-000000000010',
    versionNo: 2,
    versionStatus: 'PUBLISHED',
    experienceMinMonths: 24,
    experienceMaxMonths: 60,
    skills: [
      {
        id: '0198c8e8-0000-7000-8000-000000000030',
        jobVersionId: '0198c8e8-0000-7000-8000-000000000020',
        skillId: '0198c8e8-0000-7000-8000-000000000031',
        importance: 5,
        isRequired: true,
        weight: new Prisma.Decimal('1'),
        minExperienceMonths: 24,
        skill: { id: '0198c8e8-0000-7000-8000-000000000031', name: 'NestJS', normalizedName: 'nestjs' },
      },
      {
        id: '0198c8e8-0000-7000-8000-000000000032',
        jobVersionId: '0198c8e8-0000-7000-8000-000000000020',
        skillId: '0198c8e8-0000-7000-8000-000000000033',
        importance: 3,
        isRequired: false,
        weight: new Prisma.Decimal('0.5'),
        minExperienceMonths: null,
        skill: { id: '0198c8e8-0000-7000-8000-000000000033', name: 'Docker', normalizedName: 'docker' },
      },
    ],
  };
}

describe('JobSkillRequirementsService', () => {
  it('builds a stable matching requirement snapshot', async () => {
    const findJobVersionRequirements = jest.fn<(jobVersionId: string) => Promise<MockRequirementSnapshot | null>>();
    findJobVersionRequirements.mockImplementation(async () => snapshot());
    const service = new JobSkillRequirementsService({ findJobVersionRequirements } as unknown as MatchingRepository);

    const result = await service.getSnapshot('0198c8e8-0000-7000-8000-000000000020');

    expect(findJobVersionRequirements).toHaveBeenCalledWith('0198c8e8-0000-7000-8000-000000000020');
    expect(result).toEqual({
      jobVersionId: '0198c8e8-0000-7000-8000-000000000020',
      jobId: '0198c8e8-0000-7000-8000-000000000010',
      versionNo: 2,
      versionStatus: 'PUBLISHED',
      experienceMinMonths: 24,
      experienceMaxMonths: 60,
      skills: [
        {
          jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000030',
          skillId: '0198c8e8-0000-7000-8000-000000000031',
          name: 'NestJS',
          normalizedName: 'nestjs',
          importance: 5,
          isRequired: true,
          weight: '1',
          minExperienceMonths: 24,
        },
        {
          jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000032',
          skillId: '0198c8e8-0000-7000-8000-000000000033',
          name: 'Docker',
          normalizedName: 'docker',
          importance: 3,
          isRequired: false,
          weight: '0.5',
          minExperienceMonths: null,
        },
      ],
    });
  });

  it('returns null when the job version does not exist', async () => {
    const findJobVersionRequirements = jest.fn<(jobVersionId: string) => Promise<MockRequirementSnapshot | null>>();
    findJobVersionRequirements.mockImplementation(async () => null);
    const service = new JobSkillRequirementsService({ findJobVersionRequirements } as unknown as MatchingRepository);

    await expect(service.getSnapshot('0198c8e8-0000-7000-8000-000000000099')).resolves.toBeNull();
  });
});
