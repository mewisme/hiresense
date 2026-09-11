import { JobDetailView } from '@/features/candidate/job-detail-view';

export default async function CandidateJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <JobDetailView jobId={jobId} />;
}
