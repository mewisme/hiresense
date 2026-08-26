import { Injectable } from '@nestjs/common';

export const BASELINE_EXPERIENCE_MATCH_FORMULA_VERSION = 'experience-minimum-v1';

export interface ResumeExperienceForMatching {
  experienceMonths: number | null;
}

export type BaselineExperienceMatchStatus = 'NOT_REQUIRED' | 'UNKNOWN' | 'MISSING' | 'PARTIAL' | 'MET';

export interface BaselineExperienceMatchScore {
  formulaVersion: typeof BASELINE_EXPERIENCE_MATCH_FORMULA_VERSION;
  score: number | null;
  status: BaselineExperienceMatchStatus;
  requiredMinMonths: number | null;
  preferredMaxMonths: number | null;
  knownExperienceMonths: number;
  quantifiedEntryCount: number;
  unknownEntryCount: number;
}

@Injectable()
export class BaselineExperienceMatchingService {
  score(requiredMinMonths: number | null, preferredMaxMonths: number | null, experiences: readonly ResumeExperienceForMatching[]): BaselineExperienceMatchScore {
    const quantified = experiences.filter((experience): experience is { experienceMonths: number } => experience.experienceMonths != null);
    const knownExperienceMonths = quantified.reduce((total, experience) => total + Math.max(0, experience.experienceMonths), 0);
    const unknownEntryCount = experiences.length - quantified.length;
    const base = {
      formulaVersion: BASELINE_EXPERIENCE_MATCH_FORMULA_VERSION,
      requiredMinMonths,
      preferredMaxMonths,
      knownExperienceMonths,
      quantifiedEntryCount: quantified.length,
      unknownEntryCount,
    } as const;

    if (requiredMinMonths == null || requiredMinMonths <= 0) return { ...base, score: 100, status: 'NOT_REQUIRED' };
    if (knownExperienceMonths >= requiredMinMonths) return { ...base, score: 100, status: 'MET' };
    if (unknownEntryCount > 0) return { ...base, score: null, status: 'UNKNOWN' };
    if (knownExperienceMonths === 0) return { ...base, score: 0, status: 'MISSING' };

    return { ...base, score: Math.round((knownExperienceMonths / requiredMinMonths) * 10000) / 100, status: 'PARTIAL' };
  }
}
