import { describe, expect, it } from '@jest/globals';
import type { JobSkillRequirement } from '../services/job-skill-requirements.service';
import type { BaselineSkillMatchScore } from '../services/baseline-skill-matching.service';
import { mapBaselineSkillResults } from './baseline-skill-result.mapper';

const requirements: JobSkillRequirement[] = [
  { jobVersionSkillId: 'job-skill-1', skillId: 'skill-1', name: 'TypeScript', normalizedName: 'typescript', importance: 5, isRequired: true, weight: '1', minExperienceMonths: 24 },
  { jobVersionSkillId: 'job-skill-2', skillId: 'skill-2', name: 'Docker', normalizedName: 'docker', importance: 3, isRequired: false, weight: '0.5', minExperienceMonths: null },
];

function score(): BaselineSkillMatchScore {
  return {
    formulaVersion: 'skill-weighted-exact-v1',
    score: 66.67,
    matchedWeight: '1',
    totalWeight: '1.5',
    required: { matched: 1, missing: 0, total: 1 },
    preferred: { matched: 0, missing: 1, total: 1 },
    results: [
      { jobVersionSkillId: 'job-skill-1', skillId: 'skill-1', resumeSkillId: 'resume-skill-1', status: 'MATCHED', isRequired: true, importance: 5, configuredWeight: '1', effectiveWeight: '1', evidenceText: 'TypeScript' },
      { jobVersionSkillId: 'job-skill-2', skillId: 'skill-2', resumeSkillId: null, status: 'MISSING', isRequired: false, importance: 3, configuredWeight: '0.5', effectiveWeight: '0.5', evidenceText: null },
    ],
  };
}

describe('mapBaselineSkillResults', () => {
  it('groups matched and missing skills with explainable job requirement metadata', () => {
    const result = mapBaselineSkillResults(requirements, score());
    expect(result.matched).toEqual([expect.objectContaining({ name: 'TypeScript', isRequired: true, status: 'MATCHED', resumeSkillId: 'resume-skill-1', similarityScore: 1, evidenceText: 'TypeScript' })]);
    expect(result.missing).toEqual([expect.objectContaining({ name: 'Docker', isRequired: false, status: 'MISSING', resumeSkillId: null, similarityScore: 0, evidenceText: null })]);
  });

  it('creates rows matching the match_skill_results persistence contract', () => {
    expect(mapBaselineSkillResults(requirements, score()).persistence).toEqual([
      { jobVersionSkillId: 'job-skill-1', resumeSkillId: 'resume-skill-1', status: 'MATCHED', similarityScore: 1, evidenceText: 'TypeScript' },
      { jobVersionSkillId: 'job-skill-2', resumeSkillId: null, status: 'MISSING', similarityScore: 0, evidenceText: null },
    ]);
  });

  it('rejects an inconsistent match result instead of producing an invalid persistence row', () => {
    const invalid = score();
    invalid.results[0] = { ...invalid.results[0]!, resumeSkillId: null };
    expect(() => mapBaselineSkillResults(requirements, invalid)).toThrow('Matched skill result has no resume skill');
  });
});
