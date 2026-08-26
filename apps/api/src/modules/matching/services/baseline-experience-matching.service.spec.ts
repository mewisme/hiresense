import { describe, expect, it } from '@jest/globals';
import { BaselineExperienceMatchingService } from './baseline-experience-matching.service';

describe('BaselineExperienceMatchingService', () => {
  const service = new BaselineExperienceMatchingService();

  it('returns full score when no minimum experience is required', () => {
    expect(service.score(null, null, [])).toMatchObject({ score: 100, status: 'NOT_REQUIRED', knownExperienceMonths: 0 });
    expect(service.score(0, 60, [{ experienceMonths: null }])).toMatchObject({ score: 100, status: 'NOT_REQUIRED', unknownEntryCount: 1 });
  });

  it('returns full score when known experience meets the minimum', () => {
    expect(service.score(24, null, [{ experienceMonths: 12 }, { experienceMonths: 18 }])).toMatchObject({
      score: 100,
      status: 'MET',
      knownExperienceMonths: 30,
      quantifiedEntryCount: 2,
      unknownEntryCount: 0,
    });
  });

  it('returns a proportional deterministic score when quantified experience is below the minimum', () => {
    expect(service.score(24, null, [{ experienceMonths: 12 }])).toMatchObject({
      score: 50,
      status: 'PARTIAL',
      knownExperienceMonths: 12,
    });
    expect(service.score(36, null, [{ experienceMonths: 10 }]).score).toBe(27.78);
  });

  it('keeps unknown experience distinct from known zero experience', () => {
    expect(service.score(24, null, [{ experienceMonths: null }])).toMatchObject({ score: null, status: 'UNKNOWN', unknownEntryCount: 1 });
    expect(service.score(24, null, [])).toMatchObject({ score: 0, status: 'MISSING', unknownEntryCount: 0 });
  });

  it('does not downgrade a met minimum because another experience entry is unknown', () => {
    expect(service.score(24, 60, [{ experienceMonths: 30 }, { experienceMonths: null }])).toEqual({
      formulaVersion: 'experience-minimum-v1',
      score: 100,
      status: 'MET',
      requiredMinMonths: 24,
      preferredMaxMonths: 60,
      knownExperienceMonths: 30,
      quantifiedEntryCount: 1,
      unknownEntryCount: 1,
    });
  });

  it('does not penalize experience above the preferred maximum', () => {
    expect(service.score(24, 60, [{ experienceMonths: 84 }])).toMatchObject({ score: 100, status: 'MET', preferredMaxMonths: 60 });
  });
});
