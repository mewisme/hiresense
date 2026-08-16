import { randomUUID } from 'node:crypto';

export const RESUME_STORAGE_BUCKET = 'resumes';

export function createResumeObjectKey(userId: string): string {
  return `users/${userId}/resumes/${randomUUID()}.pdf`;
}