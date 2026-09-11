import { JobsManageView } from '@/features/recruiter/jobs-manage-view';

export default async function RecruiterJobsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <JobsManageView companyId={companyId} />;
}
