'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ManagedJobListItem } from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function JobsManageView({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<ManagedJobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || !hasRole(session, 'RECRUITER')) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const next = await apiRequest<ManagedJobListItem[]>(`/api/companies/${companyId}/jobs`);
        if (!cancelled) setJobs(next);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load jobs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, router]);

  if (loading) return <p className="text-sm text-zinc-500">Loading jobs…</p>;
  if (error)
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Jobs</h1>
          <p className="mt-2 text-sm text-zinc-600">Draft, publish, and open applicant lists.</p>
        </div>
        <Link
          href={`/recruiter/companies/${companyId}/jobs/new`}
          className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white"
        >
          Create job
        </Link>
      </div>
      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
          No jobs yet.
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const title =
              job.currentPublishedVersion?.title ?? job.currentDraftVersion?.title ?? job.slug;
            return (
              <Link
                key={job.id}
                href={`/recruiter/companies/${companyId}/jobs/${job.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                    {job.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
