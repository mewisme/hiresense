import { CandidateShell } from '@/components/candidate-shell';
import { ResumesView } from '@/features/candidate/resumes-view';

export default function CandidateResumesPage() {
  return (
    <CandidateShell>
      <ResumesView />
    </CandidateShell>
  );
}
