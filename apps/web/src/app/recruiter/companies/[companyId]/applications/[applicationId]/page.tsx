import type { ApplicationMatchRun } from '@hiresense/types';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { MatchResultEmpty } from '@/components/matching/match-result-empty';
import { MatchResultView } from '@/components/matching/match-result-view';
import { PageShell } from '@/components/page-shell';
import { ApiError, apiRequest, optionalApiRequest } from '@/lib/api';
import type { RecruiterApplicationDetail } from '@/lib/api-types';
import { runMatching } from './actions';

export const metadata: Metadata = { title: 'Applicant review' };

export default async function RecruiterApplicationPage({
  params,
}: {
  params: Promise<{ companyId: string; applicationId: string }>;
}) {
  const { companyId, applicationId } = await params;
  let application: RecruiterApplicationDetail;
  try {
    application = await apiRequest<RecruiterApplicationDetail>(
      `/companies/${companyId}/applications/${applicationId}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  let result: ApplicationMatchRun | null;
  try {
    result = await optionalApiRequest<ApplicationMatchRun>(
      `/companies/${companyId}/applications/${applicationId}/matching/current`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    throw error;
  }

  const action = runMatching.bind(null, companyId, applicationId);
  return (
    <PageShell
      eyebrow={`${application.company.name} · ${application.currentStage.name}`}
      title={application.candidate.fullName}
      subtitle={`${application.candidate.headline ?? 'Applicant'} · ${application.jobVersion.title} · ${application.resumeVersion.resume.name}`}
    >
      <div className="mb-5 flex justify-end">
        <form action={action}>
          <button
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="submit"
          >
            {result ? 'Run analysis again' : 'Run baseline analysis'}
          </button>
        </form>
      </div>
      {result ? <MatchResultView result={result} /> : <MatchResultEmpty recruiter />}
    </PageShell>
  );
}
