import { RecruiterShell } from '@/components/recruiter-shell';
import { RecruiterProfileView } from '@/features/recruiter/recruiter-profile-view';

export default function RecruiterProfilePage() {
  return (
    <RecruiterShell>
      <RecruiterProfileView />
    </RecruiterShell>
  );
}
