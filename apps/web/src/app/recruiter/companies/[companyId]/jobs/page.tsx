import { RecruiterShell } from '@/components/recruiter-shell';
import { JobsManageView } from '@/features/recruiter/jobs-manage-view';

export default async function RecruiterJobsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return (
    <RecruiterShell companyId={companyId}>
      <JobsManageView companyId={companyId} />
    </RecruiterShell>
  );
}
