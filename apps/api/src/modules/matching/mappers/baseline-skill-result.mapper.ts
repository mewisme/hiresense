import type { JobSkillRequirement } from '../services/job-skill-requirements.service';
import type { BaselineSkillMatchScore } from '../services/baseline-skill-matching.service';

export interface BaselineSkillResultItem {
  jobVersionSkillId: string;
  skillId: string;
  name: string;
  normalizedName: string;
  isRequired: boolean;
  importance: number;
  weight: string;
  minExperienceMonths: number | null;
  resumeSkillId: string | null;
  status: 'MATCHED' | 'MISSING';
  similarityScore: number;
  evidenceText: string | null;
}

export interface BaselineSkillResultPersistenceInput {
  jobVersionSkillId: string;
  resumeSkillId: string | null;
  status: 'MATCHED' | 'MISSING';
  similarityScore: number;
  evidenceText: string | null;
}

export interface BaselineSkillResultProjection {
  matched: BaselineSkillResultItem[];
  missing: BaselineSkillResultItem[];
  persistence: BaselineSkillResultPersistenceInput[];
}

export function mapBaselineSkillResults(requirements: readonly JobSkillRequirement[], skillScore: BaselineSkillMatchScore): BaselineSkillResultProjection {
  const requirementById = new Map(requirements.map((requirement) => [requirement.jobVersionSkillId, requirement] as const));
  const items = skillScore.results.map((result) => {
    const requirement = requirementById.get(result.jobVersionSkillId);
    if (!requirement || requirement.skillId !== result.skillId) throw new Error(`Missing job skill requirement for match result: ${result.jobVersionSkillId}`);
    if (result.status === 'MATCHED' && !result.resumeSkillId) throw new Error(`Matched skill result has no resume skill: ${result.jobVersionSkillId}`);
    if (result.status === 'MISSING' && result.resumeSkillId) throw new Error(`Missing skill result unexpectedly references resume skill: ${result.jobVersionSkillId}`);

    return {
      jobVersionSkillId: requirement.jobVersionSkillId,
      skillId: requirement.skillId,
      name: requirement.name,
      normalizedName: requirement.normalizedName,
      isRequired: requirement.isRequired,
      importance: requirement.importance,
      weight: requirement.weight,
      minExperienceMonths: requirement.minExperienceMonths,
      resumeSkillId: result.resumeSkillId,
      status: result.status,
      similarityScore: result.status === 'MATCHED' ? 1 : 0,
      evidenceText: result.evidenceText,
    } satisfies BaselineSkillResultItem;
  });

  return {
    matched: items.filter((item) => item.status === 'MATCHED'),
    missing: items.filter((item) => item.status === 'MISSING'),
    persistence: items.map(({ jobVersionSkillId, resumeSkillId, status, similarityScore, evidenceText }) => ({ jobVersionSkillId, resumeSkillId, status, similarityScore, evidenceText })),
  };
}
