import { describe, expect, it } from '@jest/globals';
import { Prisma } from '../../../generated/prisma/client';
import type { ApplicationMatchRunResult } from '../repositories/application-match-runs.repository';
import { toApplicationMatchRunResponse } from './application-match-run-response.mapper';

function matchRun(): ApplicationMatchRunResult {
  return {
    id: '0198c8e8-0000-7000-8000-000000000001',
    applicationId: '0198c8e8-0000-7000-8000-000000000002',
    resumeParseRunId: '0198c8e8-0000-7000-8000-000000000003',
    jobVersionId: '0198c8e8-0000-7000-8000-000000000004',
    pipelineVersionId: '0198c8e8-0000-7000-8000-000000000005',
    status: 'SUCCEEDED',
    overallScore: new Prisma.Decimal('85.29'),
    startedAt: new Date('2026-08-27T00:00:00.000Z'),
    completedAt: new Date('2026-08-27T00:00:01.000Z'),
    errorCode: null,
    errorMessage: null,
    createdAt: new Date('2026-08-27T00:00:00.000Z'),
    pipelineVersion: { id: '0198c8e8-0000-7000-8000-000000000005', code: 'matching-baseline-v1', pipelineType: 'MATCHING', semanticVersion: '1.0.0', codeRevision: null },
    resumeParseRun: { id: '0198c8e8-0000-7000-8000-000000000003', pipelineVersionId: '0198c8e8-0000-7000-8000-000000000006', status: 'SUCCEEDED', detectedLanguage: 'en', startedAt: new Date('2026-08-26T23:59:00.000Z'), completedAt: new Date('2026-08-26T23:59:01.000Z'), createdAt: new Date('2026-08-26T23:59:00.000Z') },
    components: [{ id: '0198c8e8-0000-7000-8000-000000000007', matchRunId: '0198c8e8-0000-7000-8000-000000000001', componentCode: 'SKILL', rawScore: new Prisma.Decimal('100'), weight: new Prisma.Decimal('0.705882'), weightedScore: new Prisma.Decimal('70.588235'), details: { formulaVersion: 'skill-weighted-exact-v1' }, createdAt: new Date('2026-08-27T00:00:01.000Z') }],
    skillResults: [{
      id: '0198c8e8-0000-7000-8000-000000000008', matchRunId: '0198c8e8-0000-7000-8000-000000000001', jobVersionSkillId: '0198c8e8-0000-7000-8000-000000000009', resumeSkillId: '0198c8e8-0000-7000-8000-000000000010', status: 'MATCHED', similarityScore: new Prisma.Decimal('1'), evidenceText: 'TypeScript', createdAt: new Date('2026-08-27T00:00:01.000Z'),
      jobVersionSkill: { id: '0198c8e8-0000-7000-8000-000000000009', jobVersionId: '0198c8e8-0000-7000-8000-000000000004', skillId: '0198c8e8-0000-7000-8000-000000000011', importance: 5, isRequired: true, weight: new Prisma.Decimal('1'), minExperienceMonths: null, createdAt: new Date('2026-08-27T00:00:00.000Z'), skill: { id: '0198c8e8-0000-7000-8000-000000000011', name: 'TypeScript', normalizedName: 'typescript', category: 'PROGRAMMING_LANGUAGE', description: null, isActive: true, createdAt: new Date('2026-08-27T00:00:00.000Z'), updatedAt: new Date('2026-08-27T00:00:00.000Z') } },
      resumeSkill: { id: '0198c8e8-0000-7000-8000-000000000010', parseRunId: '0198c8e8-0000-7000-8000-000000000003', skillId: '0198c8e8-0000-7000-8000-000000000011', confidence: new Prisma.Decimal('0.95'), evidenceText: 'TypeScript', createdAt: new Date('2026-08-27T00:00:00.000Z'), skill: { id: '0198c8e8-0000-7000-8000-000000000011', name: 'TypeScript', normalizedName: 'typescript', category: 'PROGRAMMING_LANGUAGE', description: null, isActive: true, createdAt: new Date('2026-08-27T00:00:00.000Z'), updatedAt: new Date('2026-08-27T00:00:00.000Z') } },
    }],
  };
}

describe('toApplicationMatchRunResponse', () => {
  it('serializes Decimal scores and exposes explainable component and skill details', () => {
    const response = toApplicationMatchRunResponse(matchRun());
    expect(response).toMatchObject({
      id: '0198c8e8-0000-7000-8000-000000000001',
      status: 'SUCCEEDED',
      overallScore: 85.29,
      pipeline: { code: 'matching-baseline-v1', pipelineType: 'MATCHING' },
      components: [{ code: 'SKILL', rawScore: 100, weight: 0.705882, weightedScore: 70.588235 }],
      skills: [{ status: 'MATCHED', similarityScore: 1, evidenceText: 'TypeScript', requirement: { name: 'TypeScript', isRequired: true, weight: '1' }, resumeSkill: { name: 'TypeScript', confidence: '0.95' } }],
    });
  });

  it('preserves null scores and unmatched resume skills', () => {
    const run = matchRun();
    run.overallScore = null;
    run.skillResults[0].similarityScore = null;
    run.skillResults[0].resumeSkillId = null;
    run.skillResults[0].resumeSkill = null;
    const response = toApplicationMatchRunResponse(run);
    expect(response.overallScore).toBeNull();
    expect(response.skills[0]).toMatchObject({ similarityScore: null, resumeSkill: null });
  });
});
