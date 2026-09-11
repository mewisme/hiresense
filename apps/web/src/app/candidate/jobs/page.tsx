import { CandidateShell } from '@/components/candidate-shell';
import { JobsListView } from '@/features/candidate/jobs-list-view';

export default function CandidateJobsPage() {
  return (
    <CandidateShell>
      <JobsListView />
    </CandidateShell>
  );
}
