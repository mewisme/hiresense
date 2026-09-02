'use server';

import { revalidatePath } from 'next/cache';
import { apiRequest } from '@/lib/api';

export async function runMatching(companyId: string, applicationId: string) {
  await apiRequest(`/companies/${companyId}/applications/${applicationId}/matching/runs`, {
    method: 'POST',
  });
  revalidatePath(`/recruiter/companies/${companyId}/applications/${applicationId}`);
}
