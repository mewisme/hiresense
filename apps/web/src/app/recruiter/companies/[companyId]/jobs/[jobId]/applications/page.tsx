import { ApplicantsListView } from '@/features/recruiter/applicants-list-view';

export default async function RecruiterApplicantsPage({
  params,
}: {
  params: Promise<{ companyId: string; jobId: string }>;
}) {
  const { companyId, jobId } = await params;
  return <ApplicantsListView companyId={companyId} jobId={jobId} />;
}
