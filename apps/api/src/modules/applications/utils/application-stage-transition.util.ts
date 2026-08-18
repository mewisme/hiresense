import type { SystemRecruitmentStageCode } from '../types/recruitment-stage.type';

const RECRUITER_STAGE_TRANSITIONS: Record<SystemRecruitmentStageCode, readonly SystemRecruitmentStageCode[]> = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFER', 'REJECTED'],
  OFFER: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function canRecruiterTransitionApplicationStage(from: SystemRecruitmentStageCode, to: SystemRecruitmentStageCode): boolean {
  return RECRUITER_STAGE_TRANSITIONS[from].includes(to);
}