import { RecruiterShell } from '@/components/recruiter-shell';
import { RecruiterHomeView } from '@/features/recruiter/recruiter-home-view';

export default function RecruiterHomePage() {
  return (
    <RecruiterShell>
      <RecruiterHomeView />
    </RecruiterShell>
  );
}
