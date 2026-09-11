import { describe, expect, it } from '@jest/globals';
import {
  BaselineEducationMatchingService,
  normalizeEducationDegree,
} from './baseline-education-matching.service';

describe('normalizeEducationDegree', () => {
  it('normalizes common English and Vietnamese degree phrases', () => {
    expect(normalizeEducationDegree('Bachelor of Science')).toBe('BACHELOR');
    expect(normalizeEducationDegree('B.S. in Computer Science')).toBe(
      'BACHELOR',
    );
    expect(normalizeEducationDegree('Thạc sĩ Khoa học Máy tính')).toBe(
      'MASTER',
    );
    expect(normalizeEducationDegree('Cử nhân Công nghệ thông tin')).toBe(
      'BACHELOR',
    );
    expect(normalizeEducationDegree('PhD')).toBe('DOCTORATE');
    expect(normalizeEducationDegree('Tiến sĩ')).toBe('DOCTORATE');
    expect(normalizeEducationDegree('Cao đẳng')).toBe('ASSOCIATE');
    expect(normalizeEducationDegree('HIGH_SCHOOL')).toBe('HIGH_SCHOOL');
  });

  it('returns null for unrecognized degree text', () => {
    expect(normalizeEducationDegree(null)).toBeNull();
    expect(normalizeEducationDegree('Certificate of attendance')).toBeNull();
  });
});

describe('BaselineEducationMatchingService', () => {
  const service = new BaselineEducationMatchingService();

  it('returns full score when no minimum degree is required', () => {
    expect(service.score(null, [])).toMatchObject({
      score: 100,
      status: 'NOT_REQUIRED',
      highestDegree: null,
    });
  });

  it('returns full score when the highest normalized degree meets the minimum', () => {
    expect(
      service.score('BACHELOR', [
        { degree: 'Associate degree' },
        {
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          institutionName: 'Example University',
        },
      ]),
    ).toMatchObject({
      score: 100,
      status: 'MET',
      highestDegree: 'BACHELOR',
      requiredMinDegree: 'BACHELOR',
      matchedEvidence:
        'Bachelor of Science · Computer Science · Example University',
    });
  });

  it('returns a proportional score when the degree is below the minimum', () => {
    expect(
      service.score('MASTER', [{ degree: 'Bachelor of Arts' }]),
    ).toMatchObject({
      score: 75,
      status: 'PARTIAL',
      highestDegree: 'BACHELOR',
      highestLevel: 3,
      requiredMinLevel: 4,
    });
  });

  it('keeps unrecognized education distinct from missing education', () => {
    expect(
      service.score('BACHELOR', [{ degree: 'Short course' }]),
    ).toMatchObject({
      score: null,
      status: 'UNKNOWN',
      unknownEntryCount: 1,
      normalizedEntryCount: 0,
    });
    expect(service.score('BACHELOR', [])).toMatchObject({
      score: 0,
      status: 'MISSING',
      entryCount: 0,
    });
  });

  it('ignores invalid required degree codes as not required', () => {
    expect(service.score('WIZARD', [{ degree: null }])).toMatchObject({
      score: 100,
      status: 'NOT_REQUIRED',
      requiredMinDegree: null,
    });
  });
});
