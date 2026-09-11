import { CandidateShell } from '@/components/candidate-shell';
import { CandidateHomeView } from '@/features/candidate/candidate-home-view';

export default function CandidateHomePage() {
  return (
    <CandidateShell>
      <CandidateHomeView />
    </CandidateShell>
  );
}
