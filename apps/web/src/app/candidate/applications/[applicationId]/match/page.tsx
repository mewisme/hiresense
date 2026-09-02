import type { ApplicationMatchRun } from '@hiresense/types';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { MatchResultEmpty } from '@/components/matching/match-result-empty';
import { MatchResultView } from '@/components/matching/match-result-view';
import { PageShell } from '@/components/page-shell';
import { ApiError, apiRequest, optionalApiRequest } from '@/lib/api';
import type { CandidateApplicationDetail } from '@/lib/api-types';

export const metadata: Metadata = { title: 'Application match' };

export default async function CandidateMatchPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  let application: CandidateApplicationDetail;
  try {
    application = await apiRequest<CandidateApplicationDetail>(
      `/candidates/me/applications/${applicationId}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  let result: ApplicationMatchRun | null;
  try {
    result = await optionalApiRequest<ApplicationMatchRun>(
      `/candidates/me/applications/${applicationId}/matching/current`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    throw error;
  }

  return (
    <PageShell
      eyebrow={`${application.job.company.name} · ${application.currentStage.name}`}
      title={application.jobVersion.title}
      subtitle={`Applied with ${application.resumeVersion.resume.name} · CV version ${application.resumeVersion.versionNo}`}
    >
      {result ? <MatchResultView result={result} /> : <MatchResultEmpty />}
    </PageShell>
  );
}
