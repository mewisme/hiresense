import { JobCreateView } from '@/features/recruiter/job-create-view';

export default async function RecruiterJobCreatePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <JobCreateView companyId={companyId} />;
}
