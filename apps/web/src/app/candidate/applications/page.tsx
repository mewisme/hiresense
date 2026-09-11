import { CandidateShell } from '@/components/candidate-shell';
import { ApplicationsListView } from '@/features/candidate/applications-list-view';

export default function CandidateApplicationsPage() {
  return (
    <CandidateShell>
      <ApplicationsListView />
    </CandidateShell>
  );
}
