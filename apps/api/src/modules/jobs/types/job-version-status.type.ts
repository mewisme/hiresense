export const JOB_VERSION_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type JobVersionStatus = (typeof JOB_VERSION_STATUSES)[number];

export function isJobVersionStatus(value: string): value is JobVersionStatus {
  return (JOB_VERSION_STATUSES as readonly string[]).includes(value);
}