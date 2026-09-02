import { MatchResultLoading } from '@/components/matching/match-result-loading';
import { PageShell } from '@/components/page-shell';

export default function Loading() {
  return (
    <PageShell eyebrow="Recruiter review" title="Loading applicant analysis">
      <MatchResultLoading />
    </PageShell>
  );
}
