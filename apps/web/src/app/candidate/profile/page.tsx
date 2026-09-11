import { CandidateShell } from '@/components/candidate-shell';
import { ProfileView } from '@/features/candidate/profile-view';

export default function CandidateProfilePage() {
  return (
    <CandidateShell>
      <ProfileView />
    </CandidateShell>
  );
}
