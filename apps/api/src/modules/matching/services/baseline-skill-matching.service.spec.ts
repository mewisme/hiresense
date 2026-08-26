import { describe, expect, it } from '@jest/globals';
import type { JobSkillRequirement } from './job-skill-requirements.service';
import { BaselineSkillMatchingService } from './baseline-skill-matching.service';

function requirement(overrides: Partial<JobSkillRequirement> = {}): JobSkillRequirement {
  return {
    jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000001',
    skillId: '0198c8e8-0000-7000-8000-000000000101',
    name: 'NestJS',
    normalizedName: 'nestjs',
    importance: 5,
    isRequired: true,
    weight: '1',
    minExperienceMonths: null,
    ...overrides,
  };
}

describe('BaselineSkillMatchingService', () => {
  const service = new BaselineSkillMatchingService();

  it('matches exact canonical skill ids and keeps resume evidence', () => {
    const result = service.score([requirement()], [{
      resumeSkillId: '0198c8e8-0000-7000-8000-000000000201',
      skillId: '0198c8e8-0000-7000-8000-000000000101',
      evidenceText: 'Built APIs with NestJS',
    }]);

    expect(result.score).toBe(100);
    expect(result.required).toEqual({ matched: 1, missing: 0, total: 1 });
    expect(result.preferred).toEqual({ matched: 0, missing: 0, total: 0 });
    expect(result.results).toEqual([{
      jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000001',
      skillId: '0198c8e8-0000-7000-8000-000000000101',
      resumeSkillId: '0198c8e8-0000-7000-8000-000000000201',
      status: 'MATCHED',
      isRequired: true,
      importance: 5,
      configuredWeight: '1',
      effectiveWeight: '1',
      evidenceText: 'Built APIs with NestJS',
    }]);
  });

  it('tracks required and preferred coverage while applying configured weights', () => {
    const requirements = [
      requirement(),
      requirement({
        jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000002',
        skillId: '0198c8e8-0000-7000-8000-000000000102',
        name: 'Docker',
        normalizedName: 'docker',
        isRequired: false,
      }),
    ];

    const result = service.score(requirements, [{
      resumeSkillId: '0198c8e8-0000-7000-8000-000000000202',
      skillId: '0198c8e8-0000-7000-8000-000000000102',
      evidenceText: 'Dockerized services',
    }]);

    expect(result.score).toBe(50);
    expect(result.matchedWeight).toBe('1');
    expect(result.totalWeight).toBe('2');
    expect(result.required).toEqual({ matched: 0, missing: 1, total: 1 });
    expect(result.preferred).toEqual({ matched: 1, missing: 0, total: 1 });
    expect(result.results.map((item) => item.status)).toEqual(['MISSING', 'MATCHED']);
  });

  it('uses configured skill weights deterministically without inventing hidden multipliers', () => {
    const result = service.score([
      requirement({ importance: 4, weight: '0.5' }),
      requirement({
        jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000002',
        skillId: '0198c8e8-0000-7000-8000-000000000102',
        importance: 2,
        isRequired: false,
        weight: '0.25',
      }),
    ], [{
      resumeSkillId: '0198c8e8-0000-7000-8000-000000000201',
      skillId: '0198c8e8-0000-7000-8000-000000000101',
      evidenceText: null,
    }]);

    expect(result.matchedWeight).toBe('0.5');
    expect(result.totalWeight).toBe('0.75');
    expect(result.score).toBe(66.67);
  });

  it('does not match a different canonical skill id even when display metadata could be similar', () => {
    const result = service.score([requirement()], [{
      resumeSkillId: '0198c8e8-0000-7000-8000-000000000201',
      skillId: '0198c8e8-0000-7000-8000-000000000999',
      evidenceText: 'Nest JS',
    }]);

    expect(result.score).toBe(0);
    expect(result.results[0]).toMatchObject({ status: 'MISSING', resumeSkillId: null, evidenceText: null });
  });

  it('returns full skill score when the job has no weighted skill requirements', () => {
    expect(service.score([], []).score).toBe(100);
    expect(service.score([requirement({ weight: '0' })], []).score).toBe(100);
  });
});
