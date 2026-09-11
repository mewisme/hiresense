import { CompanyHubView } from '@/features/recruiter/company-hub-view';

export default async function RecruiterCompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <CompanyHubView companyId={companyId} />;
}
