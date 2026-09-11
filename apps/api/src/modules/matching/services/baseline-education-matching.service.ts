import { Injectable } from '@nestjs/common';

export const BASELINE_EDUCATION_MATCH_FORMULA_VERSION =
  'education-minimum-degree-v1';

export const EDUCATION_DEGREE_LEVELS = {
  HIGH_SCHOOL: 1,
  ASSOCIATE: 2,
  BACHELOR: 3,
  MASTER: 4,
  DOCTORATE: 5,
} as const;

export type EducationDegreeCode = keyof typeof EDUCATION_DEGREE_LEVELS;

export interface ResumeEducationForMatching {
  degree: string | null;
  fieldOfStudy?: string | null;
  institutionName?: string | null;
}

export type BaselineEducationMatchStatus =
  'NOT_REQUIRED' | 'UNKNOWN' | 'MISSING' | 'PARTIAL' | 'MET';

export interface BaselineEducationMatchScore {
  formulaVersion: typeof BASELINE_EDUCATION_MATCH_FORMULA_VERSION;
  score: number | null;
  status: BaselineEducationMatchStatus;
  requiredMinDegree: EducationDegreeCode | null;
  requiredMinLevel: number | null;
  highestDegree: EducationDegreeCode | null;
  highestLevel: number | null;
  entryCount: number;
  normalizedEntryCount: number;
  unknownEntryCount: number;
  matchedEvidence: string | null;
}

const DEGREE_PATTERNS: ReadonlyArray<{
  code: EducationDegreeCode;
  pattern: RegExp;
}> = [
  {
    code: 'DOCTORATE',
    pattern: /\b(ph\.?\s*d\.?|dphil|doctorate|doctoral|doctor of|tien si)\b/i,
  },
  {
    code: 'MASTER',
    pattern:
      /\b(m\.?\s*s\.?c?\.?|m\.?\s*a\.?|m\.?\s*eng\.?|mba|ll\.?\s*m\.?|master'?s?|thac si)\b/i,
  },
  {
    code: 'BACHELOR',
    pattern:
      /\b(b\.?\s*s\.?c?\.?|b\.?\s*a\.?|b\.?\s*eng\.?|ll\.?\s*b\.?|bachelor'?s?|undergraduate|cu nhan|dai hoc)\b/i,
  },
  {
    code: 'ASSOCIATE',
    pattern: /\b(associate|a\.?\s*s\.?|a\.?\s*a\.?|diploma|cao dang)\b/i,
  },
  {
    code: 'HIGH_SCHOOL',
    pattern:
      /\b(high\s*school|secondary|ged|thpt|trung hoc|tot nghiep thpt)\b/i,
  },
];

export function isEducationDegreeCode(
  value: string | null | undefined,
): value is EducationDegreeCode {
  return (
    value != null &&
    Object.prototype.hasOwnProperty.call(EDUCATION_DEGREE_LEVELS, value)
  );
}

export function normalizeEducationDegree(
  value: string | null | undefined,
): EducationDegreeCode | null {
  if (!value) return null;
  const normalized = value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[_/|,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return null;
  if (isEducationDegreeCode(normalized.toUpperCase()))
    return normalized.toUpperCase() as EducationDegreeCode;
  for (const candidate of DEGREE_PATTERNS) {
    if (candidate.pattern.test(normalized)) return candidate.code;
  }
  return null;
}

@Injectable()
export class BaselineEducationMatchingService {
  score(
    requiredMinDegree: string | null,
    educations: readonly ResumeEducationForMatching[],
  ): BaselineEducationMatchScore {
    const required = isEducationDegreeCode(requiredMinDegree)
      ? requiredMinDegree
      : null;
    const requiredMinLevel = required
      ? EDUCATION_DEGREE_LEVELS[required]
      : null;
    const normalized = educations
      .map((education) => {
        const degree = normalizeEducationDegree(education.degree);
        return {
          degree,
          evidence:
            [
              education.degree,
              education.fieldOfStudy,
              education.institutionName,
            ]
              .filter(
                (part): part is string => !!part && part.trim().length > 0,
              )
              .join(' · ') || null,
        };
      })
      .filter((education) => education.degree != null) as Array<{
      degree: EducationDegreeCode;
      evidence: string | null;
    }>;
    const highest = normalized.reduce<{
      degree: EducationDegreeCode;
      evidence: string | null;
    } | null>((best, education) => {
      if (!best) return education;
      return EDUCATION_DEGREE_LEVELS[education.degree] >
        EDUCATION_DEGREE_LEVELS[best.degree]
        ? education
        : best;
    }, null);
    const highestDegree = highest?.degree ?? null;
    const highestLevel = highestDegree
      ? EDUCATION_DEGREE_LEVELS[highestDegree]
      : null;
    const unknownEntryCount = educations.length - normalized.length;
    const base = {
      formulaVersion: BASELINE_EDUCATION_MATCH_FORMULA_VERSION,
      requiredMinDegree: required,
      requiredMinLevel,
      highestDegree,
      highestLevel,
      entryCount: educations.length,
      normalizedEntryCount: normalized.length,
      unknownEntryCount,
      matchedEvidence: highest?.evidence ?? null,
    } as const;

    if (!required || requiredMinLevel == null)
      return { ...base, score: 100, status: 'NOT_REQUIRED' };
    if (highestLevel != null && highestLevel >= requiredMinLevel)
      return { ...base, score: 100, status: 'MET' };
    if (normalized.length === 0 && unknownEntryCount > 0)
      return { ...base, score: null, status: 'UNKNOWN' };
    if (highestLevel == null) return { ...base, score: 0, status: 'MISSING' };

    return {
      ...base,
      score: Math.round((highestLevel / requiredMinLevel) * 10000) / 100,
      status: 'PARTIAL',
    };
  }
}
