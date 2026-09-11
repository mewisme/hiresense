import { RecruiterApplicationResultView } from '@/features/matching/recruiter-application-result-view';

export default async function RecruiterApplicationPage({
  params,
}: {
  params: Promise<{ companyId: string; applicationId: string }>;
}) {
  const { companyId, applicationId } = await params;
  return <RecruiterApplicationResultView companyId={companyId} applicationId={applicationId} />;
}
