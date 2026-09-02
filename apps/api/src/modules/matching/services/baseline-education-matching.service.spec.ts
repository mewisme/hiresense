import { describe, expect, it } from '@jest/globals';
import { BaselineEducationMatchingService } from './baseline-education-matching.service';

describe('BaselineEducationMatchingService', () => {
  const service = new BaselineEducationMatchingService();

  it('excludes education from scoring when the job has no education requirement', () => {
    expect(service.score(null, [])).toMatchObject({ score: null, status: 'NOT_REQUIRED', requiredMinLevel: null });
  });

  it('matches an equal or higher recognized degree level', () => {
    expect(service.score('BACHELOR', [{ degree: 'Master of Science' }])).toMatchObject({
      score: 100,
      status: 'MET',
      requiredMinLevel: 'BACHELOR',
      highestCandidateLevel: 'MASTER',
    });
  });

  it('gives partial credit when the candidate is exactly one level below', () => {
    expect(service.score('MASTER', [{ degree: 'Bachelor of Engineering' }])).toMatchObject({ score: 70, status: 'PARTIAL' });
  });

  it('returns zero when the candidate is clearly below the required level or has no education entries', () => {
    expect(service.score('MASTER', [{ degree: 'Associate of Science' }])).toMatchObject({ score: 0, status: 'MISSING' });
    expect(service.score('BACHELOR', [])).toMatchObject({ score: 0, status: 'MISSING' });
  });

  it('uses the documented unknown baseline when education exists but the degree cannot be classified', () => {
    expect(service.score('BACHELOR', [{ degree: 'Professional Diploma in Software Engineering' }])).toMatchObject({
      score: 50,
      status: 'UNKNOWN',
      recognizedEducationCount: 0,
      unknownEducationCount: 1,
    });
  });

  it('rejects an unsupported stored requirement level instead of silently scoring it', () => {
    expect(() => service.score('UNKNOWN_LEVEL', [{ degree: 'Bachelor of Science' }])).toThrow('Unsupported education minimum level');
  });
});