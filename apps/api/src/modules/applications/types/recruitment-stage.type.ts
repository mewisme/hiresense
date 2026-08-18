export const SYSTEM_RECRUITMENT_STAGE_CODES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'] as const;
export type SystemRecruitmentStageCode = (typeof SYSTEM_RECRUITMENT_STAGE_CODES)[number];

export function isSystemRecruitmentStageCode(value: string): value is SystemRecruitmentStageCode {
  return (SYSTEM_RECRUITMENT_STAGE_CODES as readonly string[]).includes(value);
}