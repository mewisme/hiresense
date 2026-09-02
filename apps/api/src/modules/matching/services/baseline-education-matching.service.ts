import { Injectable } from '@nestjs/common';
import { JOB_EDUCATION_LEVELS, type JobEducationLevel } from '../../jobs/types/job-education-level.type';

export const BASELINE_EDUCATION_MATCH_FORMULA_VERSION = 'education-level-v1';

export interface ResumeEducationForMatching {
  degree: string | null;
}

export interface BaselineEducationMatchScore {
  formulaVersion: typeof BASELINE_EDUCATION_MATCH_FORMULA_VERSION;
  score: number | null;
  status: 'NOT_REQUIRED' | 'MET' | 'PARTIAL' | 'UNKNOWN' | 'MISSING';
  requiredMinLevel: JobEducationLevel | null;
  highestCandidateLevel: JobEducationLevel | null;
  recognizedEducationCount: number;
  unknownEducationCount: number;
  totalEducationCount: number;
}

const EDUCATION_LEVEL_RANK: Record<JobEducationLevel, number> = {
  HIGH_SCHOOL: 1,
  ASSOCIATE: 2,
  BACHELOR: 3,
  MASTER: 4,
  DOCTORATE: 5,
};

const DEGREE_PATTERNS: Array<{ level: JobEducationLevel; pattern: RegExp }> = [
  { level: 'DOCTORATE', pattern: /\b(ph\.?\s?d\.?|doctor(?:ate|al)|doctor of philosophy)\b/i },
  { level: 'MASTER', pattern: /\b(master(?:'s)?|m\.?\s?sc\.?|mba|m\.?\s?a\.?)\b/i },
  { level: 'BACHELOR', pattern: /\b(bachelor(?:'s)?|b\.?\s?sc\.?|b\.?\s?s\.?|b\.?\s?a\.?)\b/i },
  { level: 'ASSOCIATE', pattern: /\b(associate(?:'s)?|a\.?\s?s\.?|a\.?\s?a\.?)\b/i },
  { level: 'HIGH_SCHOOL', pattern: /\b(high school|secondary school|ged)\b/i },
];

@Injectable()
export class BaselineEducationMatchingService {
  score(requiredMinLevel: string | null, educations: readonly ResumeEducationForMatching[]): BaselineEducationMatchScore {
    const required = this.parseRequiredLevel(requiredMinLevel);
    const recognizedLevels = educations.flatMap((education) => {
      const level = this.detectDegreeLevel(education.degree);
      return level ? [level] : [];
    });
    const highestCandidateLevel = recognizedLevels.reduce<JobEducationLevel | null>((highest, level) => {
      if (!highest || EDUCATION_LEVEL_RANK[level] > EDUCATION_LEVEL_RANK[highest]) return level;
      return highest;
    }, null);
    const base: Omit<BaselineEducationMatchScore, 'score' | 'status'> = {
      formulaVersion: BASELINE_EDUCATION_MATCH_FORMULA_VERSION,
      requiredMinLevel: required,
      highestCandidateLevel,
      recognizedEducationCount: recognizedLevels.length,
      unknownEducationCount: educations.length - recognizedLevels.length,
      totalEducationCount: educations.length,
    };

    if (!required) return { ...base, score: null, status: 'NOT_REQUIRED' };
    if (!highestCandidateLevel) {
      if (educations.length === 0) return { ...base, score: 0, status: 'MISSING' };
      return { ...base, score: 50, status: 'UNKNOWN' };
    }

    const gap = EDUCATION_LEVEL_RANK[required] - EDUCATION_LEVEL_RANK[highestCandidateLevel];
    if (gap <= 0) return { ...base, score: 100, status: 'MET' };
    if (gap === 1) return { ...base, score: 70, status: 'PARTIAL' };
    return { ...base, score: 0, status: 'MISSING' };
  }

  private parseRequiredLevel(value: string | null): JobEducationLevel | null {
    if (value == null) return null;
    if ((JOB_EDUCATION_LEVELS as readonly string[]).includes(value)) return value as JobEducationLevel;
    throw new Error(`Unsupported education minimum level: ${value}`);
  }

  private detectDegreeLevel(degree: string | null): JobEducationLevel | null {
    if (!degree) return null;
    return DEGREE_PATTERNS.find(({ pattern }) => pattern.test(degree))?.level ?? null;
  }
}