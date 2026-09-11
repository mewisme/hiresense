import { RecruiterShell } from '@/components/recruiter-shell';
import { JobDetailManageView } from '@/features/recruiter/job-detail-manage-view';

export default async function RecruiterJobDetailPage({
  params,
}: {
  params: Promise<{ companyId: string; jobId: string }>;
}) {
  const { companyId, jobId } = await params;
  return (
    <RecruiterShell companyId={companyId}>
      <JobDetailManageView companyId={companyId} jobId={jobId} />
    </RecruiterShell>
  );
}
