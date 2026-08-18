import { describe, expect, it } from '@jest/globals';
import type { SystemRecruitmentStageCode } from '../types/recruitment-stage.type';
import { canRecruiterTransitionApplicationStage } from './application-stage-transition.util';

const ALLOWED: Array<[SystemRecruitmentStageCode, SystemRecruitmentStageCode]> = [
  ['APPLIED', 'SCREENING'],
  ['APPLIED', 'REJECTED'],
  ['SCREENING', 'SHORTLISTED'],
  ['SCREENING', 'REJECTED'],
  ['SHORTLISTED', 'INTERVIEW'],
  ['SHORTLISTED', 'REJECTED'],
  ['INTERVIEW', 'OFFER'],
  ['INTERVIEW', 'REJECTED'],
  ['OFFER', 'HIRED'],
  ['OFFER', 'REJECTED'],
];

const BLOCKED: Array<[SystemRecruitmentStageCode, SystemRecruitmentStageCode]> = [
  ['APPLIED', 'INTERVIEW'],
  ['APPLIED', 'OFFER'],
  ['SCREENING', 'INTERVIEW'],
  ['SCREENING', 'OFFER'],
  ['SHORTLISTED', 'OFFER'],
  ['SHORTLISTED', 'HIRED'],
  ['INTERVIEW', 'HIRED'],
  ['HIRED', 'REJECTED'],
  ['REJECTED', 'SCREENING'],
  ['WITHDRAWN', 'SCREENING'],
  ['APPLIED', 'WITHDRAWN'],
];

describe('canRecruiterTransitionApplicationStage', () => {
  it.each(ALLOWED)('%s -> %s is allowed', (from, to) => {
    expect(canRecruiterTransitionApplicationStage(from, to)).toBe(true);
  });

  it.each(BLOCKED)('%s -> %s is blocked', (from, to) => {
    expect(canRecruiterTransitionApplicationStage(from, to)).toBe(false);
  });

  it.each<SystemRecruitmentStageCode>(['HIRED', 'REJECTED', 'WITHDRAWN'])('%s has no recruiter transitions', (from) => {
    const targets: SystemRecruitmentStageCode[] = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'];
    for (const to of targets) expect(canRecruiterTransitionApplicationStage(from, to)).toBe(false);
  });
});