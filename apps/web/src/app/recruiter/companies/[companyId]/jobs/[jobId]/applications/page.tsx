import { RecruiterShell } from '@/components/recruiter-shell';
import { ApplicantsListView } from '@/features/recruiter/applicants-list-view';

export default async function RecruiterApplicantsPage({
  params,
}: {
  params: Promise<{ companyId: string; jobId: string }>;
}) {
  const { companyId, jobId } = await params;
  return (
    <RecruiterShell companyId={companyId}>
      <ApplicantsListView companyId={companyId} jobId={jobId} />
    </RecruiterShell>
  );
}
