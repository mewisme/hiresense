import { RecruiterShell } from '@/components/recruiter-shell';
import { CompaniesView } from '@/features/recruiter/companies-view';

export default function RecruiterCompaniesPage() {
  return (
    <RecruiterShell>
      <CompaniesView />
    </RecruiterShell>
  );
}
