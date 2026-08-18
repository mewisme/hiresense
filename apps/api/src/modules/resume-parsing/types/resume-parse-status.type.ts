export const RESUME_PARSE_STATUSES = ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'] as const;
export type ResumeParseStatus = (typeof RESUME_PARSE_STATUSES)[number];

export function isResumeParseStatus(value: string): value is ResumeParseStatus {
  return (RESUME_PARSE_STATUSES as readonly string[]).includes(value);
}