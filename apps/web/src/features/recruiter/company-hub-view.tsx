'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ManagedJobListItem } from '@/features/recruiter/types';
import { apiRequest, getAuthSession, hasRole } from '@/lib/api-client';

export function CompanyHubView({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('Company');
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
        const [companyResult, nextJobs] = await Promise.all([
          apiRequest<{ company: { name: string } }>(`/api/companies/${companyId}`),
          apiRequest<ManagedJobListItem[]>(`/api/companies/${companyId}/jobs`),
        ]);
        if (cancelled) return;
        setCompanyName(companyResult.company.name);
        setJobs(nextJobs);
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load company.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, router]);

  if (loading) return <p className="text-sm text-zinc-500">Loading company…</p>;
  if (error)
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </p>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{companyName}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Manage jobs and review applications for this company.
          </p>
        </div>
        <Link
          href={`/recruiter/companies/${companyId}/jobs/new`}
          className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white"
        >
          Create job
        </Link>
      </div>
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
            No jobs yet. Create and publish one to start receiving applications.
          </p>
        ) : (
          jobs.map((job) => {
            const title =
              job.currentPublishedVersion?.title ?? job.currentDraftVersion?.title ?? job.slug;
            return (
              <Link
                key={job.id}
                href={`/recruiter/companies/${companyId}/jobs/${job.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{job.slug}</p>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                    {job.status}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
