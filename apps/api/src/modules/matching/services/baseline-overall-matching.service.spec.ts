import { describe, expect, it } from '@jest/globals';
import { BaselineOverallMatchingService } from './baseline-overall-matching.service';

const pipelineConfig = { phase: 'internship', components: { skill: 0.6, experience: 0.25, education: 0.15 } };

describe('BaselineOverallMatchingService', () => {
  const service = new BaselineOverallMatchingService();

  it('uses configured component weights when every component is scored', () => {
    const result = service.score(pipelineConfig, [
      { code: 'SKILL', score: 80, status: 'SCORED' },
      { code: 'EXPERIENCE', score: 100, status: 'MET' },
      { code: 'EDUCATION', score: 60, status: 'SCORED' },
    ]);

    expect(result.score).toBe(82);
    expect(result.status).toBe('COMPLETE');
    expect(result.configuredWeightTotal).toBe('1');
    expect(result.scoredWeightTotal).toBe('1');
    expect(result.components.map((component) => component.effectiveWeight)).toEqual(['0.6', '0.25', '0.15']);
  });

  it('renormalizes available weights when a configured component is unavailable', () => {
    const result = service.score(pipelineConfig, [
      { code: 'SKILL', score: 80, status: 'SCORED' },
      { code: 'EXPERIENCE', score: 100, status: 'MET' },
    ]);

    expect(result.score).toBe(85.88);
    expect(result.status).toBe('PARTIAL');
    expect(result.scoredWeightTotal).toBe('0.85');
    expect(result.components).toEqual([
      expect.objectContaining({ code: 'SKILL', effectiveWeight: '0.705882', weightedScore: 56.470588 }),
      expect.objectContaining({ code: 'EXPERIENCE', effectiveWeight: '0.294118', weightedScore: 29.411765 }),
      expect.objectContaining({ code: 'EDUCATION', score: null, status: 'UNAVAILABLE', effectiveWeight: '0', weightedScore: null }),
    ]);
  });

  it('does not treat an unknown component as zero', () => {
    const result = service.score(pipelineConfig, [
      { code: 'SKILL', score: 72.5, status: 'SCORED' },
      { code: 'EXPERIENCE', score: null, status: 'UNKNOWN' },
    ]);

    expect(result.score).toBe(72.5);
    expect(result.status).toBe('PARTIAL');
    expect(result.components).toEqual([
      expect.objectContaining({ code: 'SKILL', effectiveWeight: '1' }),
      expect.objectContaining({ code: 'EXPERIENCE', score: null, status: 'UNKNOWN', effectiveWeight: '0' }),
      expect.objectContaining({ code: 'EDUCATION', score: null, status: 'UNAVAILABLE', effectiveWeight: '0' }),
    ]);
  });

  it('returns unknown when no configured component has a score', () => {
    const result = service.score(pipelineConfig, [{ code: 'EXPERIENCE', score: null, status: 'UNKNOWN' }]);
    expect(result.score).toBeNull();
    expect(result.status).toBe('UNKNOWN');
    expect(result.scoredWeightTotal).toBe('0');
  });

  it('rejects invalid pipeline component weights', () => {
    expect(() => service.score({ components: { skill: 0.6, experience: 0.3 } }, [])).toThrow('Matching component weights must sum to 1');
    expect(() => service.score({ components: { skill: 1.2 } }, [])).toThrow('Invalid matching component weight: skill');
  });
});
