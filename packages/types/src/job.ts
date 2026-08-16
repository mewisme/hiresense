export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}
