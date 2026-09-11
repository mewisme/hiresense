import { CandidateShell } from '@/components/candidate-shell';
import { CandidateApplicationResultView } from '@/features/matching/candidate-application-result-view';

export default async function CandidateApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return (
    <CandidateShell>
      <CandidateApplicationResultView applicationId={applicationId} />
    </CandidateShell>
  );
}
