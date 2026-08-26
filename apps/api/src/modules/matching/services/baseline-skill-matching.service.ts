import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { JobSkillRequirement } from './job-skill-requirements.service';

export const BASELINE_SKILL_MATCH_FORMULA_VERSION = 'skill-weighted-exact-v1';

export interface ResumeSkillForMatching {
  resumeSkillId: string;
  skillId: string;
  evidenceText: string | null;
}

export interface BaselineSkillMatchItem {
  jobVersionSkillId: string;
  skillId: string;
  resumeSkillId: string | null;
  status: 'MATCHED' | 'MISSING';
  isRequired: boolean;
  importance: number;
  configuredWeight: string;
  effectiveWeight: string;
  evidenceText: string | null;
}

export interface BaselineSkillMatchScore {
  formulaVersion: typeof BASELINE_SKILL_MATCH_FORMULA_VERSION;
  score: number;
  matchedWeight: string;
  totalWeight: string;
  required: { matched: number; missing: number; total: number };
  preferred: { matched: number; missing: number; total: number };
  results: BaselineSkillMatchItem[];
}

@Injectable()
export class BaselineSkillMatchingService {
  score(requirements: readonly JobSkillRequirement[], resumeSkills: readonly ResumeSkillForMatching[]): BaselineSkillMatchScore {
    const resumeBySkillId = new Map(resumeSkills.map((skill) => [skill.skillId, skill] as const));
    let matchedWeight = new Prisma.Decimal(0);
    let totalWeight = new Prisma.Decimal(0);
    let requiredMatched = 0;
    let requiredMissing = 0;
    let preferredMatched = 0;
    let preferredMissing = 0;

    const results = requirements.map((requirement) => {
      const resumeSkill = resumeBySkillId.get(requirement.skillId) ?? null;
      const effectiveWeight = new Prisma.Decimal(requirement.weight);
      totalWeight = totalWeight.add(effectiveWeight);
      if (resumeSkill) matchedWeight = matchedWeight.add(effectiveWeight);

      if (requirement.isRequired) {
        if (resumeSkill) requiredMatched += 1;
        else requiredMissing += 1;
      } else if (resumeSkill) preferredMatched += 1;
      else preferredMissing += 1;

      return {
        jobVersionSkillId: requirement.jobVersionSkillId,
        skillId: requirement.skillId,
        resumeSkillId: resumeSkill?.resumeSkillId ?? null,
        status: resumeSkill ? 'MATCHED' as const : 'MISSING' as const,
        isRequired: requirement.isRequired,
        importance: requirement.importance,
        configuredWeight: new Prisma.Decimal(requirement.weight).toString(),
        effectiveWeight: effectiveWeight.toString(),
        evidenceText: resumeSkill?.evidenceText ?? null,
      };
    });

    const score = totalWeight.isZero() ? 100 : Number(matchedWeight.div(totalWeight).mul(100).toDecimalPlaces(2).toFixed(2));

    return {
      formulaVersion: BASELINE_SKILL_MATCH_FORMULA_VERSION,
      score,
      matchedWeight: matchedWeight.toString(),
      totalWeight: totalWeight.toString(),
      required: { matched: requiredMatched, missing: requiredMissing, total: requiredMatched + requiredMissing },
      preferred: { matched: preferredMatched, missing: preferredMissing, total: preferredMatched + preferredMissing },
      results,
    };
  }
}
